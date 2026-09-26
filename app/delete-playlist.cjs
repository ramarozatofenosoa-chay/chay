const { createClient } = require('@base44/sdk');

async function main() {
  try {
    const base44 = createClient({
      appId: 'chay',
      token: '',
      functionsVersion: '1',
      serverUrl: '',
      appBaseUrl: ''
    });
    
    const playlists = await base44.entities.Playlist.list("-created_date", 50);
    console.log("Found", playlists.length, "playlists");
    
    const louange = playlists.find(p => p.name === "Louange Chay");
    if (louange) {
      await base44.entities.Playlist.delete(louange.id);
      console.log("Deleted playlist: Louange Chay (id:", louange.id + ")");
    } else {
      console.log("Playlist 'Louange Chay' not found");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
