import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.inviteUser(email, 'user');

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});