const API_URL = process.env.COPARENT_API_URL ?? 'https://coparent-argentina-api.vercel.app';
const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const password = `CoparentQA!${runId}`;
const parent1Email = `qa.parent1.${runId}@example.com`;
const parent2Email = `qa.parent2.${runId}@example.com`;

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}

function check(value, message) {
  if (!value) throw new Error(message);
}

console.log(`Running production smoke test ${runId} against ${API_URL}`);

const parent1 = await request('/auth/register', {
  method: 'POST',
  body: { email: parent1Email, password, firstName: 'QA', lastName: 'Parent One' },
});
const parent2 = await request('/auth/register', {
  method: 'POST',
  body: { email: parent2Email, password, firstName: 'QA', lastName: 'Parent Two' },
});
check(parent1.accessToken && parent2.accessToken, 'Both accounts must receive access tokens.');

const tenant = await request('/tenants', {
  token: parent1.accessToken,
  method: 'POST',
  body: { name: `Familia QA ${runId}`, type: 'B2C_DIRECT' },
});
const family = await request('/families', {
  token: parent1.accessToken,
  method: 'POST',
  body: { tenantId: tenant.id },
});
const invitation = await request(`/families/${family.id}/invitations`, {
  token: parent1.accessToken,
  method: 'POST',
  body: { email: parent2Email, role: 'SECONDARY_PARENT' },
});
const invitationToken = new URL(invitation.shareUrl).searchParams.get('token');
check(invitationToken, 'Invitation must include a share token.');
await request(`/invitations/${encodeURIComponent(invitationToken)}/accept`, {
  token: parent2.accessToken,
  method: 'POST',
});

const child = await request('/children', {
  token: parent1.accessToken,
  method: 'POST',
  body: {
    familyId: family.id,
    firstName: 'QA Child',
    lastName: runId,
    birthDate: '2018-05-10T00:00:00.000Z',
    observations: 'Synthetic Google Play review data.',
  },
});
const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
const event = await request('/calendar-events', {
  token: parent1.accessToken,
  method: 'POST',
  body: {
    childId: child.id,
    currentParentId: parent2.userId,
    title: 'QA school pickup',
    type: 'PICKUP_DROPOFF',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: 'Demo school',
  },
});

await request(`/families/${family.id}/settings`, {
  token: parent1.accessToken,
  method: 'PATCH',
  body: { relationshipMode: 'STRUCTURED', locale: 'es-AR', currency: 'ARS' },
});
const changeRequest = await request(`/calendar-events/${event.id}/change-requests`, {
  token: parent2.accessToken,
  method: 'POST',
  body: {
    newStartDate: new Date(startDate.getTime() + 60 * 60 * 1000).toISOString(),
    newEndDate: new Date(endDate.getTime() + 60 * 60 * 1000).toISOString(),
    reason: 'QA validates structured calendar changes.',
  },
});
await request(`/calendar-events/change-requests/${changeRequest.id}/resolve`, {
  token: parent1.accessToken,
  method: 'PATCH',
  body: { status: 'ACCEPTED' },
});

await request(`/families/${family.id}/messages`, {
  token: parent2.accessToken,
  method: 'POST',
  body: { content: 'Confirmo el nuevo horario de retiro.', category: 'LOGISTICS' },
});
await request('/expenses', {
  token: parent1.accessToken,
  method: 'POST',
  body: {
    familyId: family.id,
    paidById: parent1.userId,
    description: 'QA school supplies',
    category: 'SCHOOL',
    amount: 1200,
    splitMode: 'SHARED',
    receiptReference: 'qa://synthetic-receipt',
  },
});

const [parent1Families, parent2Families, messages, events, report, summary] = await Promise.all([
  request('/families', { token: parent1.accessToken }),
  request('/families', { token: parent2.accessToken }),
  request(`/families/${family.id}/messages`, { token: parent1.accessToken }),
  request('/calendar-events', { token: parent2.accessToken }),
  request(`/expenses/report?familyId=${family.id}&month=${new Date().toISOString().slice(0, 7)}`, {
    token: parent2.accessToken,
  }),
  request(`/expenses/summary?familyId=${family.id}`, { token: parent1.accessToken }),
]);

check(parent1Families.some((item) => item.id === family.id), 'Parent one cannot see the shared family.');
check(parent2Families.some((item) => item.id === family.id), 'Parent two cannot see the shared family.');
check(messages.some((item) => item.content === 'Confirmo el nuevo horario de retiro.'), 'Message was not shared.');
check(events.some((item) => item.id === event.id), 'Calendar event was not shared.');
check(Number(report.total) === 1200, 'Monthly expense report total is incorrect.');
check(Number(summary.totalOutstanding) === 600, 'Outstanding expense balance is incorrect.');

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      runId,
      familyId: family.id,
      accounts: [parent1Email, parent2Email],
      checks: [
        'registration and authentication',
        'family invitation and acceptance',
        'family authorization for two accounts',
        'child and calendar event',
        'structured calendar change request',
        'family message',
        'shared expense, monthly report, and balance',
      ],
    },
    null,
    2,
  ),
);
