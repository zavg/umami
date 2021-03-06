import { getWebsiteByUuid, getSessionByUuid, createSession } from 'lib/queries';
import { getClientInfo } from 'lib/request';
import { uuid, isValidId, parseToken } from 'lib/crypto';

export async function verifySession(req) {
  const { payload } = req.body;

  if (!payload) {
    throw new Error('Invalid request');
  }

  const { website: website_uuid, hostname, screen, language, session } = payload;
  const token = await parseToken(session);

  if (!isValidId(website_uuid)) {
    throw new Error(`Invalid website: ${website_uuid}`);
  }

  if (!token || token.website_uuid !== website_uuid) {
    const { userAgent, browser, os, ip, country, device } = await getClientInfo(req, payload);

    const website = await getWebsiteByUuid(website_uuid);

    if (!website) {
      throw new Error(`Website not found: ${website_uuid}`);
    }

    const { website_id } = website;
    const session_uuid = uuid(website_id, hostname, ip, userAgent, os);

    let session = await getSessionByUuid(session_uuid);

    if (!session) {
      session = await createSession(website_id, {
        session_uuid,
        hostname,
        browser,
        os,
        screen,
        language,
        country,
        device,
      });
    }

    const { session_id } = session;

    return {
      website_id,
      website_uuid,
      session_id,
      session_uuid,
    };
  }

  return token;
}
