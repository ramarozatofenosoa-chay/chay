import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Création de publication sécurisée : identité de l'auteur forcée côté serveur.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch {}
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const imageUrl = typeof body.image_url === "string" ? body.image_url : null;
    if (!text && !imageUrl) return Response.json({ error: "text requis" }, { status: 400 });
    if (text.length > 5000) return Response.json({ error: "texte trop long" }, { status: 400 });

    const authorName = caller.full_name
      || [caller.first_name, caller.last_name].filter(Boolean).join(" ")
      || "Membre";
    const post = await base44.asServiceRole.entities.CommunityPost.create({
      text,
      image_url: imageUrl,
      author_name: authorName,
      likes: 0,
      created_by_id: caller.id,
    });

    try {
      await base44.asServiceRole.functions.invoke("notifyCommunityPost", {
        post_id: post.id,
        author_id: caller.id,
        internal_secret: secrets.get("INTERNAL_INVOKE_SECRET"),
      });
    } catch {}

    return Response.json({ id: post.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
