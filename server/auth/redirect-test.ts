import { Express } from "express";

export function setupRedirectTest(app: Express) {
  // Simplified direct manual redirect
  app.get("/api/auth/bnet-direct", (req, res) => {
    console.log("Direct Battle.net auth redirect route triggered");
    
    // Generate a state parameter - using a fixed state for testing to avoid issues
    const state = "testingstate123";
    
    // Store the state in the session (important for OAuth security)
    if (req.session) {
      req.session.oauthState = state;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        } else {
          console.log("Successfully saved fixed state to session:", state);
        }
      });
    }
    
    // Construct the URL manually
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/bnet/callback`);
    const scope = "openid wow.profile";
    
    const authUrl = `https://eu.battle.net/oauth/authorize?response_type=code&client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;
    
    console.log("Manual redirect URL:", authUrl);
    console.log("Client Details:", {
      clientId: clientId ? "SET" : "NOT SET",
      protocol: req.protocol,
      host: req.get('host'),
      redirectUri: decodeURIComponent(redirectUri),
      sessionExists: !!req.session,
      sessionID: req.sessionID
    });
    
    // Perform the redirect
    res.redirect(authUrl);
  });
  
  // Test route that returns information about the Battle.net configuration
  app.get("/api/auth/bnet-config", (req, res) => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const hasClientSecret = !!process.env.BLIZZARD_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/bnet/callback`;
    
    res.json({
      blizzardClientIdSet: !!clientId,
      blizzardClientSecretSet: hasClientSecret,
      region: "eu",
      scope: "openid wow.profile",
      redirectUri,
      protocol: req.protocol,
      host: req.get('host'),
      sessionActive: !!req.session,
      environment: process.env.NODE_ENV || 'development'
    });
  });
}