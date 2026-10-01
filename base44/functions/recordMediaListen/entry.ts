import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const playlistTrackId = body.playlist_track_id;
    if (typeof playlistTrackId !== 'string' || !playlistTrackId) {
      return Response.json({ error: 'playlist_track_id required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const track = await svc.entities.PlaylistTrack.get(playlistTrackId).catch(() => null);
    if (!track || !track.audio_url) {
      return Response.json({ error: 'audio track not found' }, { status: 404 });
    }

    const listenCount = Math.max(0, Math.floor(Number(track.listen_count) || 0)) + 1;
    await svc.entities.PlaylistTrack.update(playlistTrackId, {
      listen_count: listenCount,
    });

    return Response.json({ listen_count: listenCount });
  } catch (error) {
    console.error('[recordMediaListen] Could not record listen.', error);
    return Response.json({ error: 'Could not record listen' }, { status: 500 });
  }
}
