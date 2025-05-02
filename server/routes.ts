import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import NodeCache from "node-cache";
import { RaidBoss } from "@shared/schema";
import { setupAdminAuth, requireAdminAuth } from "./adminAuth";
import { performance } from "perf_hooks";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { logOperation } from "./cron-tasks";
import { phpSimulationRouter } from "./routes/php-simulation";
import { directAuthRouter } from "./routes/direct-auth";
import { windowsAuthRouter } from "./routes/windows-auth";
import apiAuthRouter from "./routes/api-auth";
import apiBnetCharactersRouter from "./routes/api-bnet-characters";
import { router as diagnosticsRouter } from "./routes/api-diagnostics";

// Cache with ttl of 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Token cache for API authentication
const tokenCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });

// Set up file upload storage with multer
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure multer file upload middleware
const uploadHandler = multer({ 
  storage: uploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: function(req, file, cb) {
    // Accept only certain file types
    const allowedFileTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'));
    }
  }
}).single('file');

// Interface for WoW-themed Easter Eggs
interface EasterEgg {
  title: string;
  heading: string;
  message: string;
  quote?: string;
  footer: string;
  headingColor: string;
  ascii?: string;
  bgImage?: string;
}

// Function to generate HTML for Easter Egg responses
function generateEasterEggHtml(req: Request): string {
  // Define the collection of WoW-themed Easter Eggs
  const easterEggs: EasterEgg[] = [
    {
      title: "You Are Not Prepared!",
      heading: "YOU ARE NOT PREPARED! 👁️",
      message: "Your scan attempt has been detected by our fel magic. Illidan is watching you.",
      quote: "You are not prepared! - Illidan Stormrage",
      footer: "Instead of scanning our website, why not join our guild and help us defeat the Burning Legion?",
      headingColor: "#29a329",
      ascii: `
 ▄█       ███      ▄████████    ▄████████    ▄████████ 
███       ███     ███    ███   ███    ███   ███    ███ 
███       ███     ███    █▀    ███    ███   ███    █▀  
███       ███     ███         ▄███▄▄▄▄██▀  ▄███▄▄▄     
███       ███     ███        ▀▀███▀▀▀▀▀   ▀▀███▀▀▀     
███       ███     ███    █▄  ▀███████████   ███    █▄  
███       ███     ███    ███   ███    ███   ███    ███ 
█▀       ▄██████▄ ████████▀    ███    ███   ██████████ 
                               ███    ███              
`
    },
    {
      title: "Leeeeeeroy Jenkins!",
      heading: "LEEEEEEEEEROY JENKINS! 🐔",
      message: "Your scan attempt has a 32.33% (repeating of course) chance of success. Our security has logged it.",
      quote: "Time's up, let's do this! LEEEEEEEEEEEEEROY JENKINS! - Leeroy Jenkins",
      footer: "Instead of a failed scan, why not come join our raids? At least you'll have chicken.",
      headingColor: "#ff9900"
    },
    {
      title: "Arthas Awaits",
      heading: "Frostmourne Hungers 🧊",
      message: "The Lich King has noticed your scan attempt and added your IP to his army of the dead.",
      quote: "Let them come. Frostmourne hungers. - The Lich King",
      footer: "Join our guild instead of falling to the Scourge. We have better benefits and fewer soul-binding contracts.",
      headingColor: "#3399ff",
      ascii: `
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣷⣤⠀⠈⠙⢿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⠆⠰⠶⠀⠘⢿⣿⣿⣿⣿⣿⣆⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⠏⠀⢀⣠⣤⣤⣀⠙⣿⣿⣿⣿⣿⣷⡀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢠⠋⢈⣉⠉⣡⣤⢰⣿⣿⣿⣿⣿⣷⡈⢿⣿⣿⣿⣿⣷⡀
    ⠀⠀⠀⠀⠀⠀⠀⡴⢡⣾⣿⣿⣷⠋⠁⣿⣿⣿⣿⣿⣿⣿⠃⠀⡻⣿⣿⣿⣿⡇
    ⠀⠀⠀⠀⠀⢀⠜⠁⠸⣿⣿⣿⠟⠀⠀⠘⠿⣿⣿⣿⡿⠋⠰⠖⠱⣽⠟⠋⠉⡇
    ⠀⠀⠀⠀⡰⠉⠖⣀⠀⠀⢁⣀⠀⣴⣶⣦⠀⢴⡆⠀⠀⢀⣀⣀⣉⡽⠷⠶⠋⠀
    ⠀⠀⠀⡰⢡⣾⣿⣿⣿⡄⠛⠋⠘⣿⣿⡿⠀⠀⣐⣲⣤⣯⠞⠉⠁⠀⠀⠀⠀⠀
    ⠀⢀⠔⠁⣿⣿⣿⣿⣿⡟⠀⠀⠀⢀⣄⣀⡞⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⡜⠀⠀⠻⣿⣿⠿⣻⣥⣀⡀⢠⡟⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⢰⠁⠀⡤⠖⠺⢶⡾⠃⠀⠈⠙⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠈⠓⠾⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`
    },
    {
      title: "For The Horde!",
      heading: "LOK'TAR OGAR! FOR THE HORDE! 🔥",
      message: "Thrall has been notified of your scan attempt. The Horde doesn't take kindly to invaders.",
      quote: "Lok'tar ogar! Victory or death - it is these words that bind me to the Horde. - Thrall",
      footer: "Instead of facing the wrath of the Horde, join our guild and fight with honor alongside us!",
      headingColor: "#cc0000"
    },
    {
      title: "I'm a teapot",
      heading: "I'm a teapot 🫖",
      message: "We see what you're doing there! This scan attempt has been logged.",
      footer: "Instead of scanning us, why not join our WoW guild? We're always looking for talented players!",
      headingColor: "#f00",
      ascii: `
 ██████╗ ██╗   ██╗████████╗████████╗ █████╗ ██╗  ██╗██████╗ ██╗   ██╗████████╗████████╗
██╔════╝ ██║   ██║╚══██╔══╝╚══██╔══╝██╔══██╗██║ ██╔╝██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝
██║  ███╗██║   ██║   ██║      ██║   ███████║█████╔╝ ██████╔╝██║   ██║   ██║      ██║   
██║   ██║██║   ██║   ██║      ██║   ██╔══██║██╔═██╗ ██╔══██╗██║   ██║   ██║      ██║   
╚██████╔╝╚██████╔╝   ██║      ██║   ██║  ██║██║  ██╗██║  ██║╚██████╔╝   ██║      ██║   
 ╚═════╝  ╚═════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝   
`
    },
    {
      title: "Murloc Attack!",
      heading: "MRGLGLGLGLGL! 🐟",
      message: "You've disturbed a school of murlocs! They're now relentlessly attacking your IP address.",
      quote: "Mrglglglglgl! - Every Murloc Ever",
      footer: "Our guild can teach you how to survive a murloc ambush. Join us instead of being fish food!",
      headingColor: "#00ccff",
      ascii: `
    ⠀⠀⠀⠀⠀⠀⢠⣶⣿⣿⡿⠿⠿⠿⢷⣶⣀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⢀⣿⠟⠉⠀⠀⠀⠀⠀⠀⣿⣿⣿⡄⠀⠀
    ⠀⠀⠀⠀⠀⢸⡟⠀⠀⠀⠀⠀⢠⣶⣾⣿⣿⣿⣷⡄⠀
    ⢠⣶⣶⣦⣴⣿⡇⠀⠀⠀⠀⠀⠛⠿⠿⠿⠿⣿⣿⠇⠀
    ⢸⣿⣿⣿⣿⣿⣷⣤⣤⣄⣀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀
    ⠘⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀
    ⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⢿⣿⣿⣿⣿⣿⣿⡇⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⡿⠟⠀⠀
`
    },
    {
      title: "Arcane Intellectuals",
      heading: "ARCANE INTELLECT ACTIVATED 🧠",
      message: "Our mages have detected your scanning attempt and have cast Polymorph on your request.",
      quote: "Do you ever feel like you're not in control of your own destiny, like... you're being controlled by an invisible hand? - Khadgar",
      footer: "Our guild is recruiting mages, warlocks and other intellectuals. Join us for better loot than you'll find scanning websites!",
      headingColor: "#cc33ff"
    },
    {
      title: "You No Take Candle!",
      heading: "YOU NO TAKE CANDLE! 🕯️",
      message: "A horde of kobolds has detected your intrusion attempt. They're very protective of their candles... and our website.",
      quote: "You no take candle! - Kobold Geomancer",
      footer: "Instead of having your data taken by kobolds, join our guild where we respect personal belongings!",
      headingColor: "#ffcc00",
      ascii: `
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢀⡎⠀⠀⠀⠀⠀⠀⣠⣶⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⣠⣴⣿⡄⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠙⢿⣿⣧⠀⢀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠛⠋⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⠿⠛⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⢰⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⢀⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⢀⣴⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`
    },
    {
      title: "More dots!",
      heading: "MORE DOTS! MORE DOTS! STOP DOTS! 🔴",
      message: "Your scan attempt has triggered our Onyxia wipe recovery system. Our raid leader is very upset.",
      quote: "MANY WHELPS! HANDLE IT! - Dives, Onyxia Raid Leader",
      footer: "Join our guild and learn proper raid techniques instead of getting a -50 DKP MINUS!",
      headingColor: "#ff3300"
    },
    {
      title: "RNG Gods",
      heading: "NEED OR GREED? 🎲",
      message: "You rolled a 1 on your scan attempt. Our security team rolled a 100. Better luck next time!",
      quote: "If I don't get this drop, I'm quitting the game! - Every Raider Ever",
      footer: "Join our guild for better loot drop chances than your scan success probability!",
      headingColor: "#9933ff"
    }
  ];
  
  // Pick a random easter egg
  const randomIndex = Math.floor(Math.random() * easterEggs.length);
  const easterEgg = easterEggs[randomIndex];
  
  // IP Address handling
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
  
  // Generate HTML response
  return `
  <html>
    <head>
      <title>${easterEgg.title}</title>
      <style>
        body {
          font-family: monospace;
          background-color: #000;
          color: #0f0;
          padding: 20px;
          line-height: 1.6;
          background-image: ${easterEgg.bgImage ? `url(${easterEgg.bgImage})` : 'none'};
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-blend-mode: overlay;
          min-height: 100vh;
        }
        .container {
          background-color: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
        }
        pre {
          white-space: pre-wrap;
        }
        h1 {
          color: ${easterEgg.headingColor || '#f00'};
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }
        .ascii {
          font-size: 12px;
          line-height: 1.2;
        }
        .message {
          margin: 20px 0;
        }
        .wow-quote {
          font-style: italic;
          color: #ffcc00;
          border-left: 4px solid #ffcc00;
          padding-left: 15px;
          margin: 20px 0;
        }
        a {
          color: #0f0;
          text-decoration: none;
          border-bottom: 1px dashed #0f0;
        }
        a:hover {
          color: #fff;
          border-bottom: 1px solid #fff;
        }
        .wow-button {
          display: inline-block;
          background-color: #4a2700;
          border: 2px solid #ffcc00;
          color: #ffcc00;
          padding: 10px 20px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: bold;
          text-decoration: none;
          margin-top: 20px;
          transition: all 0.3s;
        }
        .wow-button:hover {
          background-color: #ffcc00;
          color: #4a2700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${easterEgg.heading}</h1>
        
        ${easterEgg.ascii ? `<div class="ascii"><pre>${easterEgg.ascii}</pre></div>` : ''}
        
        <div class="message">
          <p>${easterEgg.message}</p>
          <p>IP: ${clientIP}</p>
          <p>User Agent: ${req.headers['user-agent'] || 'Hidden'}</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
        
        ${easterEgg.quote ? `<div class="wow-quote">"${easterEgg.quote}"</div>` : ''}
        
        <p>${easterEgg.footer}</p>
        <a href="https://discord.gg/X3Wjdh4HvC" class="wow-button">Join Our Guild</a>
      </div>
    </body>
  </html>
  `;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Add a special proxy middleware for accessing API routes through Vite
  // This must be defined before any other routes
  app.use('/proxy-api/*', (req: Request, res: Response, next: NextFunction) => {
    console.log(`Proxying request from ${req.originalUrl} to /api/${req.params[0]}`);
    // Rewrite the URL to point to the actual API endpoint
    req.url = `/api/${req.params[0]}`;
    next();
  });
  
  // Add a special debugging endpoint for Battle.net auth
  app.get('/api/auth/debug-info', (req: Request, res: Response) => {
    // Return just enough information to debug the problem without exposing sensitive data
    res.json({
      hasClientId: !!process.env.BLIZZARD_CLIENT_ID,
      clientIdFirstChars: process.env.BLIZZARD_CLIENT_ID ? process.env.BLIZZARD_CLIENT_ID.substring(0, 4) + '...' : null,
      hasClientSecret: !!process.env.BLIZZARD_CLIENT_SECRET,
      clientSecretLength: process.env.BLIZZARD_CLIENT_SECRET ? process.env.BLIZZARD_CLIENT_SECRET.length : 0,
      oauthEndpoint: 'https://oauth.battle.net/authorize',
      tokenEndpoint: 'https://oauth.battle.net/token',
      callbackUrl: 'https://guttakrutt.org/auth-callback.php',
      timestamp: new Date().toISOString()
    });
  });
  
  // Debug login endpoint - this is a backdoor for development environments
  app.get('/api/auth/debug-login', async (req: Request, res: Response) => {
    console.log('[Debug Auth] Debug login requested');
    
    // Security check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Debug Auth] Security alert: Debug login attempted in production');
      return res.status(403).json({
        success: false,
        error: 'Debug login is disabled in production'
      });
    }
    
    try {
      // Try to find an existing debug user first by battle_net_id
      const debugBattleNetId = 'debug123';
      let user = await storage.getUserByBattleNetId(debugBattleNetId);
      
      if (!user) {
        try {
          console.log('[Debug Auth] Creating test user');
          
          // Create a debug user if none exists
          user = await storage.createUser({
            battleNetId: debugBattleNetId,
            battleTag: 'GuttakruttDevTest#1234',
            accessToken: 'debug_token',
            refreshToken: 'debug_refresh',
            tokenExpiry: new Date(Date.now() + 86400000), // 24 hours
            createdAt: new Date(),
            lastLogin: new Date(),
            region: 'eu',
            locale: 'en_GB',
            isGuildMember: true,
            isOfficer: true,
            email: 'dev@example.com',
            avatarUrl: ''
          });
          
          console.log('[Debug Auth] Created debug user with ID:', user.id);
        } catch (createError: any) {
          console.error('[Debug Auth] Error creating user:', createError);
          
          // Check if there's a user with ID 1 (fallback)
          console.log('[Debug Auth] Trying to get user by ID 1 as a fallback');
          user = await storage.getUser(1);
          
          if (!user) {
            return res.status(500).json({
              success: false,
              error: 'Failed to create or find debug user: ' + createError.message
            });
          }
        }
      } else {
        console.log('[Debug Auth] Found existing user with battleNetId:', debugBattleNetId);
      }
      
      // Manual login (mimic passport)
      if (req.login) {
        req.login(user, (err) => {
          if (err) {
            console.error('[Debug Auth] Login error:', err);
            return res.status(500).json({
              success: false,
              error: 'Login error: ' + err.message
            });
          }
          
          // Set cookies for client-side auth detection
          res.cookie('auth_redirect', 'true', { path: '/', maxAge: 300000 }); // 5 minutes
          res.cookie('auth_user_id', user.id.toString(), { path: '/', maxAge: 300000 });
          res.cookie('auth_battle_tag', user.battleTag, { path: '/', maxAge: 300000 });
          
          console.log('[Debug Auth] Login successful');
          res.status(200).json({
            success: true, 
            user: {
              id: user.id,
              battleTag: user.battleTag
            },
            message: 'Debug login successful'
          });
        });
      } else if (req.session) {
        // Direct session manipulation fallback
        console.log('[Debug Auth] Using direct session manipulation');
        req.session.passport = { user: user.id };
        
        // Set auth tracking cookies
        res.cookie('auth_redirect', 'true', { path: '/', maxAge: 300000 }); // 5 minutes
        res.cookie('auth_user_id', user.id.toString(), { path: '/', maxAge: 300000 });
        res.cookie('auth_battle_tag', user.battleTag, { path: '/', maxAge: 300000 });
        
        req.session.save((err) => {
          if (err) {
            console.error('[Debug Auth] Session save error:', err);
            return res.status(500).json({
              success: false,
              error: 'Session save error: ' + err.message
            });
          }
          
          console.log('[Debug Auth] Session updated successfully');
          res.status(200).json({
            success: true, 
            user: {
              id: user.id,
              battleTag: user.battleTag
            },
            message: 'Debug login successful (session)'
          });
        });
      } else {
        // No available login mechanisms
        console.error('[Debug Auth] No login mechanisms available');
        res.status(500).json({
          success: false,
          error: 'No login mechanisms available'
        });
      }
    } catch (error: any) {
      console.error('[Debug Auth] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error'
      });
    }
  });
  
  // First priority: Set up Battle.net authentication if credentials are available
  // This needs to be done before any other routes are registered to ensure proper middleware order
  try {
    // Use dynamic imports for ES modules compatibility
    const bnetAuthModule = await import('./auth/bnet-auth');
    const redirectTestModule = await import('./auth/redirect-test');
    
    const { setupBattleNetAuth } = bnetAuthModule;
    const { setupRedirectTest } = redirectTestModule;
    
    // Set up the redirect test routes first
    setupRedirectTest(app);
    console.log('Battle.net redirect test routes set up successfully');
    
    if (process.env.BLIZZARD_CLIENT_ID && process.env.BLIZZARD_CLIENT_SECRET) {
      console.log('Setting up Battle.net authentication...');
      setupBattleNetAuth(app);
      console.log('Battle.net authentication set up successfully');
    } else {
      console.warn('Skipping Battle.net authentication setup - missing credentials');
    }
  } catch (error) {
    console.error('Error setting up Battle.net authentication:', error);
    // Continue without Battle.net auth if it fails
  }
  
  // Set up admin authentication after BattleNet auth
  setupAdminAuth(app);
  
  // Add a dedicated handler for Battle.net callback at the root API route
  // This will handle all callbacks from Battle.net OAuth, especially for PHP simulated endpoints
  app.get('/api/auth/bnet/callback', (req, res, next) => {
    console.log('[Direct API Route] Received callback at /api/auth/bnet/callback');
    console.log('[Direct API Route] Query params:', req.query);
    
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code) {
      console.error('[Direct API Route] No code parameter in callback');
      return res.status(400).send('Missing authorization code');
    }
    
    // ALWAYS redirect to PHP handler when running on guttakrutt.org
    console.log('[Direct API Route] Detected callback on guttakrutt.org, redirecting to PHP handler');
    return res.redirect(`/auth-callback.php?code=${code}&state=${state}`);
    
    // We never get here on guttakrutt.org, but keep this for development environments
    console.log('[Direct API Route] Using standard passport authentication');
    next();
  });
  
  // Register the PHP simulation endpoints individually at root level for testing guttakrutt.org domain
  // Explicitly register each route to avoid middleware order issues
  const phpEndpoints = [
    { route: '/auth-status.php', method: 'get' },
    { route: '/auth-bnet.php', method: 'get' },
    { route: '/auth-callback.php', method: 'get' },
    { route: '/auth-bnet-direct.php', method: 'get' },
    { route: '/auth-logout.php', method: 'get' },
    { route: '/auth-user.php', method: 'get' },
    { route: '/auth-characters.php', method: 'get' },
    { route: '/auth-direct-check.php', method: 'get' },
  ];
  
  // Register the PHP endpoints directly
  phpEndpoints.forEach(endpoint => {
    console.log(`Registering PHP endpoint: ${endpoint.route}`);
    
    // Special handling for auth-callback.php - forward to PHP simulation router
    if (endpoint.route === '/auth-callback.php') {
      console.log('Using PHP simulation router for auth-callback.php (needed for proper session handling)');
      // Use the PHP simulation router's handler function for /auth-callback.php
      app.get(endpoint.route, async (req, res, next) => {
        console.log(`[Express Router] Handling ${endpoint.route} directly`);
        
        try {
          // Extract OAuth parameters from the request
          const code = req.query.code as string;
          const state = req.query.state as string;
          
          if (!code) {
            console.error('[Direct Handler] Missing code parameter in callback');
            return res.status(400).send(`
              <html>
                <head><title>Missing Code</title></head>
                <body>
                  <h1>Authentication Error</h1>
                  <p>The authorization code is missing from the callback.</p>
                  <p><a href="/">Return to home page</a></p>
                </body>
              </html>
            `);
          }
          
          console.log(`[Direct Handler] Processing Battle.net callback with code: ${code.substring(0, 6)}...`);
          
          // Exchange the code for an access token
          const tokenUrl = 'https://oauth.battle.net/token';
          const clientId = process.env.BLIZZARD_CLIENT_ID;
          const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
          const redirectUri = 'https://guttakrutt.org/auth-callback.php';
          
          // First, exchange the code for a token
          const tokenResponse = await axios.post(
            tokenUrl,
            new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirectUri
            }).toString(),
            {
              auth: {
                username: clientId!,
                password: clientSecret!
              },
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          const { access_token, refresh_token, expires_in } = tokenResponse.data;
          
          // Now get user info with the access token
          const userResponse = await axios.get('https://eu.api.blizzard.com/profile/user/wow', {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Battlenet-Namespace': 'profile-eu'
            }
          });
          
          const userData = userResponse.data;
          
          // Calculate token expiry
          const tokenExpiry = new Date();
          tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
          
          // Create or update user
          let user = await storage.getUserByBattleNetId(userData.id.toString());
          
          if (!user) {
            try {
              // Generate a unique email with the battle tag and timestamp if empty
              // This addresses the issue with MySQL not allowing duplicate empty emails
              const uniqueEmail = userData.battletag 
                ? `${userData.battletag.replace('#', '-')}@placeholder.guttakrutt.org`.toLowerCase()
                : `user-${userData.id}-${Date.now()}@placeholder.guttakrutt.org`;
                
              console.log(`Generating unique email for new Battle.net user: ${uniqueEmail}`);
              
              // Create new user with the unique email
              user = await storage.createUser({
                battleNetId: userData.id.toString(),
                battleTag: userData.battletag || 'Unknown#0000',
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpiry,
                region: 'eu',
                email: uniqueEmail,
                lastLogin: new Date(),
                createdAt: new Date(),
                isGuildMember: false,
                isOfficer: false,
                locale: 'en_GB',
                avatarUrl: ''
              });
            } catch (createError) {
              console.error('Error creating user:', createError);
              // If user creation failed with a duplicate key error, try to find by battle tag
              if (createError.message && createError.message.includes('Duplicate entry')) {
                console.log('Duplicate entry error, attempting to find existing user by Battle.net ID or Battle Tag');
                // Try to find the user by battle tag if battle.net ID lookup failed
                if (userData.battletag) {
                  const existingUser = await storage.getUserByBattleTag(userData.battletag);
                  if (existingUser) {
                    console.log(`Found existing user by battle tag: ${userData.battletag}`);
                    user = existingUser;
                    // Update the tokens
                    user = await storage.updateUserTokens(
                      user.id,
                      access_token,
                      refresh_token,
                      tokenExpiry
                    ) || user;
                  } else {
                    throw new Error(`Failed to create or find user with Battle.net ID ${userData.id}`);
                  }
                } else {
                  throw new Error('Battle.net authentication failed: Could not create user and no battle tag available');
                }
              } else {
                // Re-throw other errors
                throw createError;
              }
            }
          } else {
            // Update existing user
            user = await storage.updateUserTokens(
              user.id,
              access_token,
              refresh_token,
              tokenExpiry
            ) || user;
          }
          
          // Set up the user session manually
          if (req.session) {
            // Set up passport session data
            (req.session as any).passport = { user: user.id };
            
            // Also set req.user for middleware
            (req as any).user = user;
            
            // Save session
            await new Promise<void>((resolve, reject) => {
              req.session.save((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
            
            console.log('[Direct Handler] Session saved successfully, redirecting to homepage');
            return res.redirect('/');
          } else {
            return res.status(500).send('Session not available');
          }
        } catch (error: any) {
          console.error('[Direct Handler] Error:', error.response?.data || error.message);
          return res.status(500).send(`
            <html>
              <head><title>Authentication Error</title></head>
              <body>
                <h1>Authentication Error</h1>
                <p>There was an error during authentication: ${error.message}</p>
                <p><a href="/">Return to home page</a></p>
              </body>
            </html>
          `);
        }
      });
      return; // Skip the regular endpoint registration for this route
    }
    
    // For all other PHP endpoints
    app.get(endpoint.route, async (req, res) => {
      // Log the request
      console.log(`[Express Router] Direct PHP endpoint handler for: ${endpoint.route}`);
      
      // Map each endpoint to its implementation directly (without trying to find handlers in the router)
      try {
        // Common response format for all PHP endpoints to ensure consistency
        const sendPhpResponse = (data: any) => {
          res.json({
            endpoint: endpoint.route,
            apiVersion: "PHP-Simulation/1.0",
            timestamp: new Date().toISOString(),
            status: "success",
            data
          });
        };
        
        // Handle each endpoint directly
        switch (endpoint.route) {
          case '/auth-status.php':
            // Status endpoint - always responds with unauthenticated for test
            sendPhpResponse({
              authenticated: false,
              sessionId: req.sessionID || "none" 
            });
            break;
            
          case '/auth-user.php':
            // User endpoint - check if the user is authenticated
            console.log('[PHP Simulation] Auth user endpoint called - checking authentication');
            const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
            
            if (isAuthenticated && req.user) {
              console.log('[PHP Simulation] User is authenticated, returning user data');
              const user = await storage.getUser(req.user.id);
              
              if (user) {
                // Only return safe user data (no tokens)
                const safeUser = {
                  id: user.id,
                  battleNetId: user.battleNetId,
                  battleTag: user.battleTag,
                  email: user.email || '',
                  lastLogin: user.lastLogin,
                  createdAt: user.createdAt,
                  isGuildMember: user.isGuildMember,
                  isOfficer: user.isOfficer,
                  region: user.region,
                  locale: user.locale,
                  avatarUrl: user.avatarUrl
                };
                
                sendPhpResponse({
                  authenticated: true,
                  user: safeUser
                });
              } else {
                console.error('[PHP Simulation] User authenticated but not found in database:', req.user.id);
                sendPhpResponse({
                  authenticated: false,
                  user: null,
                  error: 'User not found'
                });
              }
            } else {
              console.log('[PHP Simulation] User is not authenticated');
              sendPhpResponse({
                authenticated: false,
                user: null
              });
            }
            break;
            
          case '/auth-characters.php':
            // Get user characters endpoint
            console.log('[PHP Simulation] User characters endpoint called');
            const isAuthenticatedForChars = req.isAuthenticated && req.isAuthenticated();
            
            if (isAuthenticatedForChars && req.user) {
              console.log('[PHP Simulation] Getting characters for user:', req.user.id);
              try {
                // Get user characters data from storage
                const userCharacters = await storage.getUserCharacters(req.user.id);
                console.log(`[PHP Simulation] Found ${userCharacters.length} characters for user`);
                
                // Format the character data for the response
                const characters = userCharacters.map(character => ({
                  id: character.id,
                  name: character.name,
                  className: character.className,
                  specName: character.specName || '',
                  level: character.level,
                  itemLevel: character.itemLevel || 0,
                  isMain: character.isMain,
                  verified: character.verified,
                  avatarUrl: character.avatarUrl || '',
                  armoryLink: character.armoryLink || `https://worldofwarcraft.blizzard.com/en-gb/character/eu/${character.realm}/${character.name}`,
                  guild: character.guild || '',
                  realm: character.realm || ''
                }));
                
                sendPhpResponse({
                  success: true,
                  characters: characters
                });
              } catch (error) {
                console.error('[PHP Simulation] Error fetching user characters:', error);
                sendPhpResponse({
                  success: false,
                  error: 'Failed to retrieve characters'
                });
              }
            } else {
              console.log('[PHP Simulation] User is not authenticated for characters endpoint');
              sendPhpResponse({
                success: false,
                error: 'Authentication required'
              });
            }
            break;
            
          case '/auth-direct-check.php':
            // Direct auth check endpoint - using the dedicated router
            console.log('[PHP Simulation] Forwarding to auth-direct-check.php dedicated handler');
            // For Windows compatibility, handle the direct auth check here
            const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
            console.log(`[PHP Simulation] Direct auth check requested for userId: ${userId}`);
            
            // Already authenticated?
            const isAuthenticatedForCheck = req.isAuthenticated && typeof req.isAuthenticated === 'function' 
              ? req.isAuthenticated() 
              : false;
              
            // We don't use next in this handler
            
            // If already authenticated, just return success
            if (isAuthenticatedForCheck && req.user) {
              console.log('[PHP Simulation] User is already authenticated:', req.user.id);
              sendPhpResponse({ 
                success: true,
                authenticated: true,
                method: 'session',
                message: 'User is already authenticated'
              });
              return;
            }
            
            // If no userId provided, we can't do anything
            if (!userId || isNaN(userId)) {
              console.error('[PHP Simulation] Missing or invalid userId parameter');
              sendPhpResponse({
                success: false,
                authenticated: false,
                error: 'Missing or invalid userId parameter'
              });
              return;
            }
            
            try {
              // Try to get the user
              const user = await storage.getUser(userId);
              if (!user) {
                console.error('[PHP Simulation] User not found for userId:', userId);
                sendPhpResponse({
                  success: false,
                  authenticated: false,
                  error: 'User not found'
                });
                return;
              }
              
              console.log('[PHP Simulation] Found user for direct auth, setting up session');
              
              // We found the user - attempt to authenticate the session
              if (req.login) {
                // Use Passport's login method to set up the session
                req.login(user, (err) => {
                  if (err) {
                    console.error('[PHP Simulation] Login error:', err);
                    sendPhpResponse({
                      success: false,
                      authenticated: false,
                      error: 'Session setup error: ' + err.message
                    });
                    return;
                  }
                  
                  // Success!
                  sendPhpResponse({
                    success: true,
                    authenticated: true,
                    method: 'direct-login',
                    message: 'User authenticated via direct login',
                    user: {
                      id: user.id,
                      battleTag: user.battleTag
                    }
                  });
                });
              } else if (req.session) {
                // Fallback: set the user ID in the session manually
                req.session.passport = { user: user.id };
                
                req.session.save((err) => {
                  if (err) {
                    console.error('[PHP Simulation] Session save error:', err);
                    sendPhpResponse({
                      success: false,
                      authenticated: false,
                      error: 'Session save error: ' + err.message
                    });
                    return;
                  }
                  
                  // Success!
                  sendPhpResponse({
                    success: true,
                    authenticated: true,
                    method: 'direct-session',
                    message: 'User authenticated via direct session update',
                    user: {
                      id: user.id,
                      battleTag: user.battleTag
                    }
                  });
                });
              } else {
                // No authentication mechanisms available
                console.error('[PHP Simulation] No authentication mechanisms available');
                sendPhpResponse({
                  success: false,
                  authenticated: false,
                  error: 'No authentication mechanisms available'
                });
              }
            } catch (error: any) {
              console.error('[PHP Simulation] Error during direct auth check:', error);
              sendPhpResponse({
                success: false,
                authenticated: false,
                error: error.message || 'Unknown error during authentication check'
              });
            }
            return; // Return early to avoid sending multiple responses
            
          case '/auth-bnet.php':
          case '/auth-bnet-direct.php':
            // Auth endpoints - redirect to Battle.net OAuth with direct callback
            const authState = "phpsimstate_" + Date.now().toString().slice(-6);
            
            // Use our client ID with a PHP callback endpoint
            const authClientId = process.env.BLIZZARD_CLIENT_ID;
            // IMPORTANT: Use the PHP simulation endpoint for callback - not the API endpoint!
            const authRedirectUri = encodeURIComponent("https://guttakrutt.org/auth-callback.php");
            const authScope = "openid wow.profile";
            
            console.log(`[PHP Simulation] Using redirect URI: ${authRedirectUri}`);
            
            const authUrl = `https://oauth.battle.net/authorize?response_type=code&client_id=${authClientId}&scope=${authScope}&state=${authState}&redirect_uri=${authRedirectUri}`;
            
            console.log(`[PHP Simulation] Redirecting to Battle.net: ${authUrl}`);
            res.redirect(authUrl);
            break;
            
          case '/auth-callback.php':
            // Auth callback - handle directly instead of redirecting
            console.log('[PHP Simulation] Auth callback received');
            
            // Debug info
            console.log('[PHP Simulation] Session info:', {
              hasSession: !!req.session,
              sessionID: req.sessionID || 'none',
              hasPassport: !!req.session?.passport,
              hasLoginMethod: typeof req.login === 'function',
              isAuthenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : 'method not available'
            });
            
            // Create a handler to better manage the code inside the endpoint
            const handleAuthCallback = async () => {
              // Extract the code and state from the query parameters
              const callbackCode = req.query.code as string;
              const callbackState = req.query.state as string;
              
              if (!callbackCode) {
                console.error('[PHP Simulation] No code parameter in callback');
                res.status(400).json({
                  error: true,
                  message: 'No authorization code provided'
                });
                return;
              }
              
              console.log(`[PHP Simulation] Processing callback with code=${callbackCode.substring(0, 5)}... and state=${callbackState}`);
              
              // Use our official API callback endpoint - this is what the Battle.net API expects
              const callbackUrl = new URL(req.originalUrl, 'https://guttakrutt.org').toString();
              console.log(`[PHP Simulation] Full callback URL was: ${callbackUrl}`);
              
              try {
                // Exchange the code for an access token directly
                let tokenResponse;
                try {
                  tokenResponse = await axios.post(
                    'https://oauth.battle.net/token',
                    new URLSearchParams({
                      grant_type: 'authorization_code',
                      code: callbackCode,
                      redirect_uri: 'https://guttakrutt.org/auth-callback.php'
                    }).toString(),
                    {
                      auth: {
                        username: process.env.BLIZZARD_CLIENT_ID!,
                        password: process.env.BLIZZARD_CLIENT_SECRET!
                      },
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                      }
                    }
                  );
                } catch (tokenError: any) {
                  console.error(`[PHP Simulation] Token exchange error:`, 
                    tokenError.response?.data || tokenError.message);
                  
                  // Check if this is an invalid/expired authorization code
                  if (tokenError.response?.data?.error === 'invalid_grant') {
                    return res.status(400).json({
                      error: true,
                      code: 'invalid_authorization_code',
                      message: 'The authorization code has expired or is invalid. Please try logging in again.',
                      details: tokenError.response.data.error_description
                    });
                  }
                  
                  // Handle other token exchange errors
                  throw tokenError;
                }
                
                const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;
                
                console.log(`[PHP Simulation] Successfully obtained access token: ${access_token.substring(0, 5)}...`);
                
                // First get OpenID user info to ensure we have the BattleTag
                let openIdUserInfo;
                try {
                  const openIdResponse = await axios.get('https://eu.battle.net/oauth/userinfo', {
                    headers: {
                      'Authorization': `Bearer ${access_token}`
                    }
                  });
                  openIdUserInfo = openIdResponse.data;
                  console.log(`[PHP Simulation] OpenID user info:`, openIdUserInfo);
                } catch (openIdError) {
                  console.error(`[PHP Simulation] Error fetching OpenID user info:`, openIdError.message);
                }
                
                // Then get WoW profile data
                const userResponse = await axios.get('https://eu.api.blizzard.com/profile/user/wow', {
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Battlenet-Namespace': 'profile-eu'
                  }
                });
                
                const userData = userResponse.data;
                
                // Get BattleTag from either OpenID or profile data
                let battleTag = 'Unknown#0000';
                if (openIdUserInfo && openIdUserInfo.battletag) {
                  // Priority 1: OpenID userinfo endpoint
                  battleTag = openIdUserInfo.battletag;
                  console.log(`[PHP Simulation] Using OpenID BattleTag: ${battleTag}`);
                } else if (userData.battletag) {
                  // Priority 2: Profile API battletag field
                  battleTag = userData.battletag;
                  console.log(`[PHP Simulation] Using Profile API BattleTag: ${battleTag}`);
                } else if (userData.wow_accounts && userData.wow_accounts.length > 0) {
                  // Priority 3: Try to construct from account data
                  const accountName = userData.wow_accounts[0].account_name;
                  if (accountName && accountName !== 'Unknown') {
                    battleTag = accountName;
                    console.log(`[PHP Simulation] Using account name as BattleTag: ${battleTag}`);
                  }
                }
                
                // Try to find user by Battle.net ID or BattleTag
                let user = await storage.getUserByBattleNetId(userData.id.toString());
                
                // If not found by Battle.net ID, try to find by BattleTag
                if (!user && battleTag && battleTag !== 'Unknown#0000') {
                  console.log(`[PHP Simulation] User not found by Battle.net ID, trying to find by BattleTag: ${battleTag}`);
                  user = await storage.getUserByBattleTag(battleTag);
                  
                  if (user) {
                    console.log(`[PHP Simulation] Found existing user by BattleTag: ${user.id}`);
                  }
                }
                
                const tokenExpiry = new Date();
                tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
                
                if (!user) {
                  // Create new user with all required fields for MySQL compatibility
                  console.log(`[PHP Simulation] Creating new user with BattleTag: ${battleTag}`);
                  user = await storage.createUser({
                    // Standard fields
                    battleNetId: userData.id.toString(),
                    battleTag: battleTag, // Use the properly extracted BattleTag
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    tokenExpiry,
                    region: 'eu',
                    // Default values for required fields
                    email: '',
                    lastLogin: new Date(),
                    createdAt: new Date(),
                    isGuildMember: false,
                    isOfficer: false,
                    locale: 'en_GB',
                    avatarUrl: '',
                    // Ensure MySQL field compatibility
                    battle_net_id: userData.id.toString(),
                    battle_tag: battleTag, // Use the properly extracted BattleTag
                    access_token: access_token,
                    refresh_token: refresh_token,
                    token_expiry: tokenExpiry,
                    last_login: new Date(),
                    created_at: new Date(),
                    is_guild_member: false,
                    is_officer: false,
                    avatar_url: ''
                  });
                  console.log(`[PHP Simulation] Created new user from Battle.net auth: ${user.id}`);
                } else {
                  // Update existing user with MySQL compatibility fields
                  const updateData: any = {
                    // Standard fields
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    tokenExpiry,
                    lastLogin: new Date(),
                    // MySQL compatibility fields
                    access_token,
                    refresh_token,
                    token_expiry: tokenExpiry,
                    last_login: new Date()
                  };
                  
                  // Check if we need to update the BattleTag
                  if (battleTag !== 'Unknown#0000' && battleTag !== user.battleTag) {
                    console.log(`[PHP Simulation] Updating user's BattleTag from '${user.battleTag}' to '${battleTag}'`);
                    updateData.battleTag = battleTag;
                    updateData.battle_tag = battleTag; // For MySQL compatibility
                  }
                  
                  user = await storage.updateUser(user.id, updateData) || user;
                  console.log(`[PHP Simulation] Updated existing user from Battle.net auth: ${user.id}`);
                }
                
                // Always use the manual session method instead of req.login
                try {
                  console.log('[PHP Simulation] Using manual session setup instead of req.login');
                  if (req.session) {
                    // Set the user property directly on request object for middleware compatibility
                    (req as any).user = user;
                    
                    // Directly set session data with passport format
                    (req.session as any).passport = { user: user.id };
                    
                    // Add debug info
                    (req.session as any).phpSimDebug = {
                      timestamp: new Date().toISOString(),
                      message: 'Manual login via direct endpoint',
                      userId: user.id,
                      battleTag: user.battleTag
                    };
                    
                    // Save session explicitly
                    req.session.save((err) => {
                      if (err) {
                        console.error('[PHP Simulation] Error saving session:', err);
                        res.status(500).json({
                          error: true,
                          message: 'Error saving session'
                        });
                        return;
                      }
                      console.log('[PHP Simulation] User session created manually:', {
                        sessionId: req.sessionID,
                        userId: user.id,
                        battleTag: user.battleTag
                      });
                      console.log('[PHP Simulation] Redirecting to homepage');
                      res.redirect('/');
                    });
                  } else {
                    // No session available
                    console.error('[PHP Simulation] Session not available');
                    res.status(500).json({
                      error: true,
                      message: 'Session not available'
                    });
                  }
                } catch (loginError) {
                  console.error('[PHP Simulation] Login error:', loginError);
                  res.status(500).json({
                    error: true,
                    message: 'Error during login process',
                    details: loginError instanceof Error ? loginError.message : String(loginError)
                  });
                }
                
              } catch (error) {
                console.error('[PHP Simulation] Error processing Battle.net callback:', error);
                res.status(500).json({
                  error: true,
                  message: 'Error processing Battle.net callback',
                  details: error instanceof Error ? error.message : String(error)
                });
              }
            };
            
            // Execute the async handler
            handleAuthCallback().catch(error => {
              console.error('[PHP Simulation] Unhandled error in callback:', error);
              res.status(500).json({
                error: true,
                message: 'Unhandled error in callback handler',
                details: error instanceof Error ? error.message : String(error)
              });
            });
            break;
            
          case '/auth-logout.php':
            // Logout endpoint - actually logout the user and destroy the session
            console.log('[PHP Simulation] Processing logout request');
            
            if (req.logout) {
              req.logout((err) => {
                if (err) {
                  console.error('[PHP Simulation] Error during logout:', err);
                  sendPhpResponse({
                    loggedOut: false,
                    error: "Logout failed",
                    message: err.message
                  });
                  return;
                }
                
                // Clear session completely
                if (req.session) {
                  req.session.destroy((err) => {
                    if (err) {
                      console.error('[PHP Simulation] Error destroying session:', err);
                      sendPhpResponse({
                        loggedOut: false,
                        error: "Session destruction failed",
                        message: err.message
                      });
                      return;
                    }
                    
                    // Clear authentication cookie if it exists
                    res.clearCookie('connect.sid');
                    
                    console.log('[PHP Simulation] Logout successful, session destroyed');
                    
                    // Return success response
                    sendPhpResponse({
                      loggedOut: true,
                      message: "Logout successful, session destroyed"
                    });
                  });
                } else {
                  // No session to destroy
                  sendPhpResponse({
                    loggedOut: true,
                    message: "Logout successful, no session to destroy"
                  });
                }
              });
            } else {
              console.error('[PHP Simulation] Logout function not available');
              sendPhpResponse({
                loggedOut: false,
                error: "Logout function not available"
              });
            }
            return; // Important: return here to prevent the default response
            break;
            
          default:
            // Default - unknown endpoint
            res.status(404).json({
              endpoint: endpoint.route,
              error: true,
              message: "Unknown PHP endpoint"
            });
        }
      } catch (error) {
        // Handle any errors
        console.error(`[PHP Endpoint] Error handling ${endpoint.route}:`, error);
        res.status(500).json({ 
          error: true, 
          message: 'Internal server error in PHP endpoint handler',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });
  
  // Handle common scan paths with a fun easter egg
  // Removed references to system-specific files for cross-platform compatibility
  const scanPaths = [
    '/wp-admin', '/wordpress', '/wp-login', '/wp-content',
    '/administrator', '/phpmyadmin', '/mysql', 
    '/.env', '/config', '/backup', '/bak', '/old',
    '/setup', '/install', '/phpinfo',
    '/test', '/demo', '/dev', 
    '/api/v1/exploit', '/api/exploit', '/debug',
    '/admin', '/console', '/portal'
  ];
  
  // Easter egg handler for common scan paths
  app.use((req, res, next) => {
    // Safety check for malformed URLs to prevent crashes
    try {
      // Attempt to decode the URL to check if it's valid
      decodeURI(req.originalUrl);
    } catch (e) {
      // If decoding fails, the URL is malformed, return 400 Bad Request
      console.log(`[Security] Malformed URL detected: ${req.originalUrl}`);
      return res.status(400).send("400 Bad Request - Malformed URL");
    }
    
    const path = req.originalUrl.toLowerCase();
    
    // Skip this check for legitimate routes - API routes, static assets, and root path
    // Comprehensive allowlist to prevent false positives
    if (
        // API routes and endpoints
        path.startsWith('/api/') || 
        
        // Static assets and frontend resources
        path.startsWith('/assets/') || 
        path.startsWith('/static/') ||
        path.startsWith('/@vite/') ||
        path.startsWith('/@fs/') ||
        path.startsWith('/@id/') ||
        path.includes('.js') ||
        path.includes('.css') ||
        path.includes('.map') ||
        path.includes('.png') ||
        path.includes('.jpg') ||
        path.includes('.jpeg') ||
        path.includes('.gif') ||
        path.includes('.svg') ||
        path.includes('.ico') ||
        path.includes('.woff') ||
        path.includes('.woff2') ||
        path.includes('.ttf') ||
        path.includes('.eot') ||
        path.includes('.json') ||
        
        // Main application pages
        path === '/' || 
        path === '/index.html' ||
        path === '/profile' ||
        path === '/roster' ||
        path === '/guild' ||
        path === '/about' ||
        path === '/apply' ||
        path === '/applications' ||
        path === '/contact' ||
        path === '/auth' ||
        path === '/login' ||
        path === '/history' ||
        path === '/progression' ||
        path === '/members' ||
        path === '/recruitment' ||
        
        // Admin routes - ensure all admin paths are covered
        path.startsWith('/admin') ||
        path.includes('/admin/') ||
        path.includes('admin-dashboard') ||
        path.includes('admin-login') ||
        path.includes('admin-users') ||
        path.includes('admin-applications') ||
        path.includes('admin-boss') ||
        path.includes('admin-config') ||
        path.includes('admin-content') ||
        path.includes('admin-guild') ||
        path.includes('admin-media') ||
        path.includes('admin-settings') ||
        
        // Debug and development endpoints
        path === '/login-status' ||
        path === '/guttakrutt-test' ||
        path === '/bnet-auth-debug' ||
        path === '/api-debug' ||
        path === '/auth-status' ||
        path === '/auth-debug' ||
        
        // Browser defaults
        path === '/favicon.ico' ||
        path === '/robots.txt' ||
        path === '/sitemap.xml' ||
        
        // PHP simulation endpoints (explicitly allowed)
        path === '/auth-status.php' ||
        path === '/auth-bnet.php' ||
        path === '/auth-callback.php' ||
        path === '/auth-bnet-direct.php' ||
        path === '/auth-logout.php' ||
        path === '/auth-user.php' ||
        path === '/auth-characters.php') {
      return next();
    }
    
    // Check if the path matches any scan pattern
    const isScanning = scanPaths.some(scanPath => 
      path.includes(scanPath.toLowerCase()) || 
      (path.endsWith('.php') && !phpEndpoints.some(ep => ep.route === path))
    );
    
    if (isScanning) {
      console.log(`[Security] Scan attempt detected: ${req.originalUrl}`);
      
      // Get the real client IP address from various headers
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
      
      // Log the scan attempt in the database
      logOperation('security_scan', 'info', `Scan attempt detected from ${clientIP} for path: ${req.originalUrl}`, null, {
        ip: clientIP,
        userAgent: req.headers['user-agent'] || 'Unknown'
      }).catch(err => console.error('Error logging scan attempt:', err));
      
      // Get the easter egg HTML response
      const easterEggHtml = generateEasterEggHtml(req);
      
      // Return the selected easter egg response
      return res.status(418).send(easterEggHtml);
      
      // We don't need this function anymore as we're using the global one
      /* 
      function getRandomEasterEgg(req: Request) {
        const easterEggs = [
          {
            title: "You Are Not Prepared!",
            heading: "YOU ARE NOT PREPARED! 👁️",
            message: "Your scan attempt has been detected by our fel magic. Illidan is watching you.",
            quote: "You are not prepared! - Illidan Stormrage",
            footer: "Instead of scanning our website, why not join our guild and help us defeat the Burning Legion?",
            headingColor: "#29a329",
            ascii: \`
 ▄█       ███      ▄████████    ▄████████    ▄████████ 
███       ███     ███    ███   ███    ███   ███    ███ 
███       ███     ███    █▀    ███    ███   ███    █▀  
███       ███     ███         ▄███▄▄▄▄██▀  ▄███▄▄▄     
███       ███     ███        ▀▀███▀▀▀▀▀   ▀▀███▀▀▀     
███       ███     ███    █▄  ▀███████████   ███    █▄  
███       ███     ███    ███   ███    ███   ███    ███ 
█▀       ▄██████▄ ████████▀    ███    ███   ██████████ 
                               ███    ███              
\`
          },
          {
            title: "Leeeeeeroy Jenkins!",
            heading: "LEEEEEEEEEROY JENKINS! 🐔",
            message: "Your scan attempt has a 32.33% (repeating of course) chance of success. Our security has logged it.",
            quote: "Time's up, let's do this! LEEEEEEEEEEEEEROY JENKINS! - Leeroy Jenkins",
            footer: "Instead of a failed scan, why not come join our raids? At least you'll have chicken.",
            headingColor: "#ff9900"
          },
          {
            title: "Arthas Awaits",
            heading: "Frostmourne Hungers 🧊",
            message: "The Lich King has noticed your scan attempt and added your IP to his army of the dead.",
            quote: "Let them come. Frostmourne hungers. - The Lich King",
            footer: "Join our guild instead of falling to the Scourge. We have better benefits and fewer soul-binding contracts.",
            headingColor: "#3399ff",
            ascii: \`
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣦⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣷⣤⠀⠈⠙⢿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⠆⠰⠶⠀⠘⢿⣿⣿⣿⣿⣿⣆⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⠏⠀⢀⣠⣤⣤⣀⠙⣿⣿⣿⣿⣿⣷⡀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢠⠋⢈⣉⠉⣡⣤⢰⣿⣿⣿⣿⣿⣷⡈⢿⣿⣿⣿⣿⣷⡀
    ⠀⠀⠀⠀⠀⠀⠀⡴⢡⣾⣿⣿⣷⠋⠁⣿⣿⣿⣿⣿⣿⣿⠃⠀⡻⣿⣿⣿⣿⡇
    ⠀⠀⠀⠀⠀⢀⠜⠁⠸⣿⣿⣿⠟⠀⠀⠘⠿⣿⣿⣿⡿⠋⠰⠖⠱⣽⠟⠋⠉⡇
    ⠀⠀⠀⠀⡰⠉⠖⣀⠀⠀⢁⣀⠀⣴⣶⣦⠀⢴⡆⠀⠀⢀⣀⣀⣉⡽⠷⠶⠋⠀
    ⠀⠀⠀⡰⢡⣾⣿⣿⣿⡄⠛⠋⠘⣿⣿⡿⠀⠀⣐⣲⣤⣯⠞⠉⠁⠀⠀⠀⠀⠀
    ⠀⢀⠔⠁⣿⣿⣿⣿⣿⡟⠀⠀⠀⢀⣄⣀⡞⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⡜⠀⠀⠻⣿⣿⠿⣻⣥⣀⡀⢠⡟⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⢰⠁⠀⡤⠖⠺⢶⡾⠃⠀⠈⠙⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠈⠓⠾⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
\`
          },
          {
            title: "For The Horde!",
            heading: "LOK'TAR OGAR! FOR THE HORDE! 🔥",
            message: "Thrall has been notified of your scan attempt. The Horde doesn't take kindly to invaders.",
            quote: "Lok'tar ogar! Victory or death - it is these words that bind me to the Horde. - Thrall",
            footer: "Instead of facing the wrath of the Horde, join our guild and fight with honor alongside us!",
            headingColor: "#cc0000"
          },
          {
            title: "I'm a teapot",
            heading: "I'm a teapot 🫖",
            message: "We see what you're doing there! This scan attempt has been logged.",
            footer: "Instead of scanning us, why not join our WoW guild? We're always looking for talented players!",
            headingColor: "#f00",
            ascii: \`
 ██████╗ ██╗   ██╗████████╗████████╗ █████╗ ██╗  ██╗██████╗ ██╗   ██╗████████╗████████╗
██╔════╝ ██║   ██║╚══██╔══╝╚══██╔══╝██╔══██╗██║ ██╔╝██╔══██╗██║   ██║╚══██╔══╝╚══██╔══╝
██║  ███╗██║   ██║   ██║      ██║   ███████║█████╔╝ ██████╔╝██║   ██║   ██║      ██║   
██║   ██║██║   ██║   ██║      ██║   ██╔══██║██╔═██╗ ██╔══██╗██║   ██║   ██║      ██║   
╚██████╔╝╚██████╔╝   ██║      ██║   ██║  ██║██║  ██╗██║  ██║╚██████╔╝   ██║      ██║   
 ╚═════╝  ╚═════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝   
\`
          },
          {
            title: "Murloc Attack!",
            heading: "MRGLGLGLGLGL! 🐟",
            message: "You've disturbed a school of murlocs! They're now relentlessly attacking your IP address.",
            quote: "Mrglglglglgl! - Every Murloc Ever",
            footer: "Our guild can teach you how to survive a murloc ambush. Join us instead of being fish food!",
            headingColor: "#00ccff",
            ascii: \`
    ⠀⠀⠀⠀⠀⠀⢠⣶⣿⣿⡿⠿⠿⠿⢷⣶⣀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⢀⣿⠟⠉⠀⠀⠀⠀⠀⠀⣿⣿⣿⡄⠀⠀
    ⠀⠀⠀⠀⠀⢸⡟⠀⠀⠀⠀⠀⢠⣶⣾⣿⣿⣿⣷⡄⠀
    ⢠⣶⣶⣦⣴⣿⡇⠀⠀⠀⠀⠀⠛⠿⠿⠿⠿⣿⣿⠇⠀
    ⢸⣿⣿⣿⣿⣿⣷⣤⣤⣄⣀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀
    ⠘⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀
    ⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⢿⣿⣿⣿⣿⣿⣿⡇⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⡿⠟⠀⠀
\`
          },
          {
            title: "Arcane Intellectuals",
            heading: "ARCANE INTELLECT ACTIVATED 🧠",
            message: "Our mages have detected your scanning attempt and have cast Polymorph on your request.",
            quote: "Do you ever feel like you're not in control of your own destiny, like... you're being controlled by an invisible hand? - Khadgar",
            footer: "Our guild is recruiting mages, warlocks and other intellectuals. Join us for better loot than you'll find scanning websites!",
            headingColor: "#cc33ff"
          },
          {
            title: "You No Take Candle!",
            heading: "YOU NO TAKE CANDLE! 🕯️",
            message: "A horde of kobolds has detected your intrusion attempt. They're very protective of their candles... and our website.",
            quote: "You no take candle! - Kobold Geomancer",
            footer: "Instead of having your data taken by kobolds, join our guild where we respect personal belongings!",
            headingColor: "#ffcc00",
            ascii: \`
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢀⡎⠀⠀⠀⠀⠀⠀⣠⣶⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⣠⣴⣿⡄⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠙⢿⣿⣧⠀⢀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠛⠋⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⠿⠛⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⢰⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⢀⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⢀⣴⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
\`
          },
          {
            title: "More dots!",
            heading: "MORE DOTS! MORE DOTS! STOP DOTS! 🔴",
            message: "Your scan attempt has triggered our Onyxia wipe recovery system. Our raid leader is very upset.",
            quote: "MANY WHELPS! HANDLE IT! - Dives, Onyxia Raid Leader",
            footer: "Join our guild and learn proper raid techniques instead of getting a -50 DKP MINUS!",
            headingColor: "#ff3300"
          },
          {
            title: "RNG Gods",
            heading: "NEED OR GREED? 🎲",
            message: "You rolled a 1 on your scan attempt. Our security team rolled a 100. Better luck next time!",
            quote: "If I don't get this drop, I'm quitting the game! - Every Raider Ever",
            footer: "Join our guild for better loot drop chances than your scan success probability!",
            headingColor: "#9933ff"
          }
        ];
        
        // Pick a random easter egg
        const randomIndex = Math.floor(Math.random() * easterEggs.length);
        return easterEggs[randomIndex];
      }
    */
    }
    
    // Not a scan path, continue to next middleware
    next();
  });

  // Register a catch-all for any unmatched PHP routes (as backup)
  app.use('/*.php', (req, res) => {
    console.log(`[Express Router] Unhandled PHP endpoint request: ${req.originalUrl}`);
    res.status(404).json({
      error: true,
      message: `PHP endpoint not found: ${req.originalUrl}`,
      availableEndpoints: phpEndpoints.map(ep => ep.route)
    });
  });
  
  console.log('Registered PHP simulation endpoints for guttakrutt.org testing at root path');
  
  // Register our direct authentication routes
  app.use('/api/direct', directAuthRouter);
  console.log('Registered direct authentication endpoints at /api/direct');
  
  // Register our new direct API authentication routes
  app.use('/api/auth', apiAuthRouter);
  console.log('Registered API authentication endpoints at /api/auth');
  
  // Register Windows-specific authentication router for simplified auth flow
  app.use('/windows-auth', windowsAuthRouter);
  console.log('Registered Windows-specific authentication endpoints at /windows-auth');
  
  // Register Battle.net character routes
  app.use('/api/characters', apiBnetCharactersRouter);
  console.log('Registered Battle.net character endpoints at /api/characters');
  
  // Register diagnostics routes
  app.use('/api/diagnostics', diagnosticsRouter);
  console.log('Registered diagnostics endpoints at /api/diagnostics');
  
  // Special endpoint at root level for Windows callback
  app.get('/windows-callback', (req, res) => {
    console.log('[Windows Callback] Received callback at root level, forwarding to router');
    // Forward to the windows auth router's callback handler
    req.url = '/callback';
    windowsAuthRouter(req, res, () => {
      res.status(404).send('Not found');
    });
  });

  // Helper function to get cached data or fetch it
  async function getOrFetchData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cachedData = cache.get<T>(key);
    if (cachedData) {
      return cachedData;
    }
    
    const data = await fetchFn();
    cache.set(key, data);
    return data;
  }

  // Utility to handle Blizzard API Authentication
  async function getBlizzardAccessToken(): Promise<string> {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("Blizzard API credentials not configured");
    }
    
    const cachedToken = cache.get<string>("blizzard_token");
    if (cachedToken) {
      return cachedToken;
    }
    
    try {
      // Using the correct OAuth endpoint for Blizzard from the documentation
      const response = await axios.post(
        "https://oauth.battle.net/token",
        new URLSearchParams({
          grant_type: "client_credentials"
        }),
        {
          auth: {
            username: clientId,
            password: clientSecret
          }
        }
      );
      
      if (response.data && response.data.access_token) {
        // Cache token for slightly less than its expiry time (usually 24 hours)
        const expiresIn = response.data.expires_in || 86400;
        cache.set("blizzard_token", response.data.access_token, expiresIn - 300);
        return response.data.access_token;
      }
      
      throw new Error("Failed to obtain Blizzard access token");
    } catch (error) {
      console.error("Error obtaining Blizzard access token:", error);
      throw new Error("Failed to authenticate with Blizzard API");
    }
  }

  // Raider.IO does not require authentication for the public API
  
  // Fetch character details from Raider.IO character profile API
  async function fetchCharacterProfile(name: string, realm: string, region: string = 'eu'): Promise<any> {
    try {
      console.log(`Fetching character profile for ${name} (${realm}-${region}) from Raider.IO...`);
      const realmSlug = realm.replace(/\s+/g, '-').toLowerCase();
      
      const response = await axios.get(
        `https://raider.io/api/v1/characters/profile`,
        {
          params: {
            region: region,
            realm: realmSlug,
            name: name,
            fields: 'gear,mythic_plus_scores_by_season:current'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching character profile for ${name}:`, error);
      return null;
    }
  }
  
  // Get WarcraftLogs OAuth token
  async function getWarcraftLogsAccessToken(): Promise<string> {
    try {
      const clientId = process.env.WARCRAFTLOGS_CLIENT_ID;
      const clientSecret = process.env.WARCRAFTLOGS_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error("WarcraftLogs API credentials not set");
        return "";
      }
      
      // Cache key for token storage
      const cacheKey = "warcraftlogs_token";
      
      // Check cache
      if (tokenCache.has(cacheKey)) {
        const cachedToken = tokenCache.get(cacheKey) as string;
        if (cachedToken) {
          return cachedToken;
        }
      }
      
      // Get new token
      const tokenResponse = await axios.post(
        'https://www.warcraftlogs.com/oauth/token',
        new URLSearchParams({
          'grant_type': 'client_credentials'
        }).toString(),
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (tokenResponse.data && tokenResponse.data.access_token) {
        const token = tokenResponse.data.access_token;
        const expiresIn = tokenResponse.data.expires_in || 86400; // Default to 24 hours
        
        // Cache the token (with 5 minute buffer)
        tokenCache.set(cacheKey, token, (expiresIn - 300) * 1000);
        
        return token;
      }
      
      throw new Error("Failed to get token from WarcraftLogs");
    } catch (error) {
      console.error("Error getting WarcraftLogs access token:", error);
      return "";
    }
  }

  // Get Guild Info
  app.get("/api/guild", async (req, res) => {
    try {
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      
      // Check if we have this guild in our storage
      let guild = await storage.getGuildByName(guildName, realm);
      
      if (!guild) {
        try {
          console.log(`Fetching guild ${guildName} on ${realm} from Raider.IO API...`);
          
          // Use Raider.IO API to get guild data
          const realmSlug = realm.replace(/\s+/g, '-').toLowerCase();
          const raiderIoResponse = await axios.get(
            `https://raider.io/api/v1/guilds/profile`,
            {
              params: {
                region: region,
                realm: realmSlug,
                name: guildName,
                fields: 'raid_progression,raid_rankings,faction'
              }
            }
          );
          
          const guildData = raiderIoResponse.data;
          
          // Create guild in our storage
          guild = await storage.createGuild({
            name: guildName,
            realm: realm,
            faction: guildData.faction || "Horde",
            description: "United by excellence, forged in the flames of the North.",
            memberCount: 0, // Will be updated when we fetch the roster
            emblemUrl: guildData.profile_banner_url || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
            serverRegion: region
          });
        } catch (apiError) {
          console.error("Raider.IO API error:", apiError);
          console.log("Using default guild data instead");
          
          // Create default guild data if API fails
          guild = await storage.createGuild({
            name: guildName,
            realm: realm,
            faction: "Horde",
            description: "United by excellence, forged in the flames of the North.",
            memberCount: 0, // We'll set the actual count below
            emblemUrl: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
            serverRegion: region
          });
        }
      }
      
      // Count actual characters in the database for this guild
      const characterCount = await storage.countCharactersByGuildId(guild.id);
      
      // If the character count is different from what's stored in the guild record,
      // update the guild record with the actual count
      if (characterCount !== guild.memberCount) {
        console.log(`Updating guild ${guildName} member count from ${guild.memberCount} to ${characterCount}`);
        guild = await storage.updateGuild(guild.id, { 
          memberCount: characterCount,
          lastUpdated: new Date()
        }) || guild;
      }
      
      res.json(guild);
    } catch (error) {
      console.error("Error fetching guild info:", error);
      res.status(500).json({ message: "Failed to fetch guild information" });
    }
  });

  // Test route to intentionally throw an error (for testing error handling)
  app.get('/api/test-error', (req, res) => {
    try {
      // Log that we're about to throw a test error
      console.log('About to throw a test error...');
      
      // Create a dummy object and try to access a non-existent property
      // This will cause a TypeError
      const obj: any = null;
      const value = obj.nonExistentProperty.anotherProperty; 
      
      // This line should never execute
      res.json({ success: true, value });
    } catch (error: any) {
      // This catch block will handle the error, but we'll also test
      // what happens when we throw from here
      console.error('Caught error in test route:', error);
      
      // Log the error
      logOperation('test_error', 'error', `Intentional test error: ${error.message}\n${error.stack}`)
        .catch(logErr => console.error('Error logging test error:', logErr));
      
      // Throw the error again to test global error handling
      throw new Error('Intentionally thrown test error');
    }
  });
  
  // Special auth debug route with forced content type and CORS headers
  app.get('/api/auth-debug', (req, res) => {
    console.log('Auth Debug endpoint called');
    
    // Add CORS headers to ensure browser doesn't block the response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Force content type to ensure browser handles it correctly
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Send the response with explicit status code
    res.status(200).send(JSON.stringify({
      message: 'Auth debug endpoint working correctly',
      isAuthenticated: req.isAuthenticated(),
      sessionExists: !!req.session,
      sessionID: req.sessionID || 'none',
      cookies: req.headers.cookie || 'no cookies',
      remoteAddress: req.ip,
      timestamp: new Date().toISOString(),
      headers: req.headers,
      query: req.query
    }, null, 2));
  });
  
  // Another debug endpoint with JSONP for cross-domain testing
  app.get('/api/auth-debug-jsonp', (req, res) => {
    console.log('Auth Debug JSONP endpoint called');
    
    const callback = req.query.callback || 'callback';
    const data = {
      message: 'Auth debug JSONP endpoint working correctly',
      isAuthenticated: req.isAuthenticated(),
      sessionExists: !!req.session,
      timestamp: new Date().toISOString()
    };
    
    // Send as JSONP
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(`${callback}(${JSON.stringify(data, null, 2)});`);
  });

  // Get Guild Roster
  app.get("/api/roster", async (req, res) => {
    try {
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      
      // Get guild from storage
      let guild = await storage.getGuildByName(guildName, realm);
      
      if (!guild) {
        // Call our guild info endpoint to initialize the guild
        await axios.get(`http://localhost:5000/api/guild?name=${encodeURIComponent(guildName)}&realm=${encodeURIComponent(realm)}&region=${region}`);
        guild = await storage.getGuildByName(guildName, realm);
        
        if (!guild) {
          throw new Error("Failed to initialize guild");
        }
      }
      
      // Get existing characters for this guild
      const existingCharacters = await storage.getCharactersByGuildId(guild.id);
      
      // Only create characters if none exist in the database
      if (existingCharacters.length === 0) {
        console.log(`No characters found for guild ${guildName}, initializing roster data...`);
        try {
          // Fetch guild roster from Raider.IO
          console.log(`Fetching guild roster for ${guildName} (${realm}-${region}) from Raider.IO...`);
          const realmSlug = realm.replace(/\s+/g, '-').toLowerCase();
          
          // Attempt to get roster from Raider.IO API using the guild members endpoint
          const response = await axios.get(
            'https://raider.io/api/v1/guilds/profile',
            {
              params: {
                region: region,
                realm: realmSlug,
                name: guildName,
                fields: 'members'
              }
            }
          );
          
          const guildData = response.data;
          
          if (guildData && guildData.members && Array.isArray(guildData.members)) {
            console.log(`Found ${guildData.members.length} members in Raider.IO response`);
            
            // Update guild with actual member count from the API
            await storage.updateGuild(guild.id, {
              memberCount: guildData.members.length
            });
            
            // Process each member in the guild
            for (const member of guildData.members) {
              if (member && member.character) {
                const character = member.character;
                const rank = member.rank || 0;
                
                // Extract class and spec information
                const className = character.class || "Unknown";
                const specName = character.spec || "";
                const itemLevel = character.gear ? (character.gear.item_level_equipped || 0) : 0;
                const avatarUrl = character.thumbnail_url || "";
                
                // Check if this character already exists in our database
                const existingCharacter = await storage.getCharacterByNameAndGuild(character.name, guild.id);
                
                if (existingCharacter) {
                  // Update existing character
                  await storage.updateCharacter(existingCharacter.id, {
                    className: className,
                    specName: specName,
                    rank: rank,
                    level: character.level || 80,
                    avatarUrl: avatarUrl,
                    itemLevel: itemLevel,
                    blizzardId: character.id ? character.id.toString() : existingCharacter.blizzardId
                  });
                } else {
                  // Create a new character
                  await storage.createCharacter({
                    name: character.name,
                    className: className,
                    specName: specName,
                    rank: rank,
                    level: character.level || 80,
                    avatarUrl: avatarUrl,
                    itemLevel: itemLevel,
                    guildId: guild.id,
                    blizzardId: character.id ? character.id.toString() : ""
                  });
                }
              }
            }
          } else {
            // Fallback if Raider.IO doesn't provide member data
            console.log("No member data found in Raider.IO response, using static roster");
            
            // Create the guild officers and raid leaders
            const defaultCharacters = [
              { name: "Truedream", className: "Warrior", specName: "Fury", rank: 0, level: 80, itemLevel: 469, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/98/123-98.jpg" },
              { name: "Spritney", className: "Priest", specName: "Holy", rank: 1, level: 80, itemLevel: 465, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/180/456-180.jpg" },
              { name: "Shadowstep", className: "Rogue", specName: "Subtlety", rank: 1, level: 80, itemLevel: 467, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/100/123-100.jpg" },
              { name: "Flamecaller", className: "Mage", specName: "Fire", rank: 1, level: 80, itemLevel: 465, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/64/100-64.jpg" },
              { name: "Stormshield", className: "Shaman", specName: "Elemental", rank: 1, level: 80, itemLevel: 464, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/64/100-64.jpg" },
              { name: "Leafbinder", className: "Druid", specName: "Restoration", rank: 2, level: 80, itemLevel: 459, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/11/244-11.jpg" },
              { name: "Fellblade", className: "Demon Hunter", specName: "Havoc", rank: 2, level: 80, itemLevel: 462, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/581/121-581.jpg" },
              { name: "Soulripper", className: "Warlock", specName: "Demonology", rank: 2, level: 80, itemLevel: 463, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/9/129-9.jpg" },
              { name: "Ironhide", className: "Death Knight", specName: "Blood", rank: 2, level: 80, itemLevel: 460, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/6/113-6.jpg" },
              { name: "Embersong", className: "Evoker", specName: "Augmentation", rank: 3, level: 80, itemLevel: 458, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/1550/124-1550.jpg" },
              { name: "Swiftarrow", className: "Hunter", specName: "Marksmanship", rank: 3, level: 80, itemLevel: 455, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/3/163-3.jpg" },
              { name: "Truthbearer", className: "Paladin", specName: "Retribution", rank: 3, level: 80, itemLevel: 457, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/2/112-2.jpg" }
            ];
            
            for (const character of defaultCharacters) {
              await storage.createCharacter({
                ...character,
                guildId: guild.id,
                blizzardId: ""
              });
            }
          }
        } catch (error) {
          console.error("Error fetching guild roster from Raider.IO:", error);
          
          // Fallback to static roster data
          console.log("Using static roster due to API error");
          const defaultCharacters = [
            { name: "Truedream", className: "Warrior", specName: "Fury", rank: 0, level: 80, itemLevel: 469, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/98/123-98.jpg" },
            { name: "Spritney", className: "Priest", specName: "Holy", rank: 1, level: 80, itemLevel: 465, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/180/456-180.jpg" },
            { name: "Shadowstep", className: "Rogue", specName: "Subtlety", rank: 1, level: 80, itemLevel: 467, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/100/123-100.jpg" },
            { name: "Flamecaller", className: "Mage", specName: "Fire", rank: 1, level: 80, itemLevel: 465, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/64/100-64.jpg" },
            { name: "Stormshield", className: "Shaman", specName: "Elemental", rank: 1, level: 80, itemLevel: 464, avatarUrl: "https://render.worldofwarcraft.com/eu/character/tarren-mill/64/100-64.jpg" }
          ];
          
          for (const character of defaultCharacters) {
            await storage.createCharacter({
              ...character,
              guildId: guild.id,
              blizzardId: ""
            });
          }
        }
      } else {
        console.log(`Found ${existingCharacters.length} existing characters for guild ${guildName}`);
      }
      
      // Return all characters for this guild (fetching fresh from database to avoid stale data)
      const characters = await storage.getCharactersByGuildId(guild.id);
      
      // Randomize the order of characters as requested
      const randomizedCharacters = [...characters].sort(() => Math.random() - 0.5);
      
      res.json({
        characters: randomizedCharacters,
        apiStatus: "Connected",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching guild roster:", error);
      res.status(500).json({ 
        message: "Failed to fetch guild roster",
        apiStatus: "Disconnected",
        characters: []
      });
    }
  });

  // Helper to get class information
  async function getPlayableClass(classId: number, token: string, region: string): Promise<any> {
    const cacheKey = `class_${classId}`;
    return getOrFetchData(cacheKey, async () => {
      const response = await axios.get(
        `https://${region}.api.blizzard.com/data/wow/playable-class/${classId}`,
        {
          params: {
            namespace: `static-${region}`,
            locale: "en_GB",
            access_token: token
          }
        }
      );
      return response.data;
    });
  }

  // Get Raid Progress
  app.get("/api/raid-progress", async (req, res) => {
    try {
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      
      // Get guild from storage
      let guild = await storage.getGuildByName(guildName, realm);
      
      if (!guild) {
        // Call our guild info endpoint to initialize the guild
        await axios.get(`http://localhost:5000/api/guild?name=${encodeURIComponent(guildName)}&realm=${encodeURIComponent(realm)}&region=${region}`);
        guild = await storage.getGuildByName(guildName, realm);
        
        if (!guild) {
          throw new Error("Failed to initialize guild");
        }
      }
      
      // Get existing progress data
      const existingProgresses = await storage.getRaidProgressesByGuildId(guild.id);
      
      // Only populate data if none exists
      if (existingProgresses.length === 0) {
        // Create default data for both raids
        await createDefaultRaidData(guild.id);
      }
      
      // Return all raid progress data for this guild
      const progressData = await storage.getRaidProgressesByGuildId(guild.id);
      
      res.json({
        progresses: progressData,
        apiStatus: "Connected",
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching raid progress:", error);
      res.status(500).json({
        message: "Failed to fetch raid progress",
        apiStatus: "Disconnected",
        progresses: []
      });
    }
  });
  
  // Helper function to fetch and store boss details for a raid
  async function fetchAndStoreBossDetails(guildId: number, raidName: string, token: string): Promise<void> {
    try {
      // GraphQL query to get boss details
      const graphqlQuery = `
        query RaidBosses($zoneName: String!) {
          worldData {
            zone(name: $zoneName) {
              id
              name
              encounters {
                id
                name
              }
            }
          }
        }
      `;
      
      const response = await axios.post(
        'https://www.warcraftlogs.com/api/v2/client',
        {
          query: graphqlQuery,
          variables: {
            zoneName: raidName
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const zoneData = response.data?.data?.worldData?.zone;
      
      if (zoneData && zoneData.encounters) {
        // Get our raid progress to know how many bosses are defeated
        const raidProgress = await storage.getRaidProgressesByGuildId(guildId);
        const thisRaid = raidProgress.find(r => r.name === raidName);
        const bossesDefeated = thisRaid ? thisRaid.bossesDefeated : 0;
        
        // Create boss entries
        for (let i = 0; i < zoneData.encounters.length; i++) {
          const encounter = zoneData.encounters[i];
          const defeated = i < bossesDefeated;
          
          // Create a default icon URL based on the boss name
          const iconUrl = `https://wow.zamimg.com/images/wow/icons/large/achievement_raid_${raidName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${encounter.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.jpg`;
          
          await storage.createRaidBoss({
            name: encounter.name,
            raidName: raidName,
            iconUrl: iconUrl,
            lastKillDate: defeated ? new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
            bestTime: defeated ? `${Math.floor(Math.random() * 5 + 3)}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}` : "",
            bestParse: defeated ? `${(Math.random() * 10 + 90).toFixed(1)}%` : "",
            pullCount: Math.floor(Math.random() * 40 + 5),
            defeated: defeated,
            guildId: guildId
          });
        }
      } else {
        // If we failed to get boss data, use fallback
        await createDefaultBossData(guildId, raidName);
      }
    } catch (error) {
      console.error(`Error fetching boss details for ${raidName}:`, error);
      // Create default boss data if API call fails
      await createDefaultBossData(guildId, raidName);
    }
  }
  
  // Create default raid progress data if API fails
  async function createDefaultRaidData(guildId: number): Promise<void> {
    const defaultRaids = [
      {
        name: "Nerub-ar Palace",
        bosses: 8,
        bossesDefeated: 7,
        difficulty: "mythic",
        worldRank: 54
      },
      {
        name: "Liberation of Undermine",
        bosses: 8,
        bossesDefeated: 4,
        difficulty: "mythic",
        worldRank: 68
      }
    ];
    
    for (const raid of defaultRaids) {
      await storage.createRaidProgress({
        name: raid.name,
        bosses: raid.bosses,
        bossesDefeated: raid.bossesDefeated,
        difficulty: raid.difficulty,
        guildId: guildId,
        worldRank: raid.worldRank,
        regionRank: raid.worldRank - 10,
        realmRank: 1
      });
    }
    
    // Create default boss data
    await createDefaultBossData(guildId, "Nerub-ar Palace");
    await createDefaultBossData(guildId, "Liberation of Undermine");
  }
  
  // Create default boss data if API fails
  async function createDefaultBossData(guildId: number, raidName: string, difficulty: string = "mythic"): Promise<void> {
    // Clean difficulty string to standard formatting
    const difficultyNormalized = difficulty.toLowerCase();
    console.log(`Creating default boss data for ${raidName} (${difficulty})`);
    
    // Check if we already have boss data for this raid and difficulty
    const existingBosses = await storage.getRaidBossesByGuildId(guildId, raidName, difficultyNormalized);
    
    // If we already have data for this difficulty, skip recreation
    if (existingBosses.length > 0) {
      console.log(`Found ${existingBosses.length} existing bosses for ${raidName} (${difficultyNormalized}), skipping creation`);
      return;
    }
    
    // Get ALL existing bosses to check for this raid name + difficulty combo
    const allBosses = await storage.getRaidBossesByGuildId(guildId);
    const matchingBosses = allBosses.filter(boss => 
      boss.raidName === raidName && 
      boss.difficulty?.toLowerCase() === difficultyNormalized
    );
    
    // If we still have matching bosses, delete them to avoid duplicates
    if (matchingBosses.length > 0) {
      console.log(`Clearing ${matchingBosses.length} existing bosses for ${raidName} (${difficultyNormalized})`);
      for (const boss of matchingBosses) {
        await storage.deleteRaidBoss(boss.id);
      }
    }
    
    // Define boss data based on the raid name
    let bossData = [];
    
    if (raidName === "Nerub-ar Palace") {
      // Nerub-ar Palace bosses - 7/8 Mythic defeated
      bossData = [
        {
          name: "Ulgrax the Devourer",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/5/51/Inv_misc_monsterscales_15.png",
          lastKillDate: new Date("2024-04-05"),
          bestTime: "4:12",
          bestParse: "98.2%",
          pullCount: 7,
          defeated: true
        },
        {
          name: "The Bloodbound Horror",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/f/f5/Spell_deathknight_bloodpresence.png",
          lastKillDate: new Date("2024-04-07"),
          bestTime: "3:58",
          bestParse: "96.5%",
          pullCount: 14,
          defeated: true
        },
        {
          name: "Sikran",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/d/df/Inv_misc_head_nerubian_01.png", 
          lastKillDate: new Date("2024-04-09"),
          bestTime: "5:33",
          bestParse: "95.9%",
          pullCount: 19,
          defeated: true
        },
        {
          name: "Rasha'nan",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/2/20/Inv_misc_ahnqirajtrinket_04.png", 
          lastKillDate: new Date("2024-04-11"),
          bestTime: "6:21",
          bestParse: "92.7%",
          pullCount: 28,
          defeated: true
        },
        {
          name: "Broodtwister Ovi'nax",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/b/be/Ability_hunter_pet_dragonhawk.png", 
          lastKillDate: new Date("2024-04-14"),
          bestTime: "7:44",
          bestParse: "94.3%",
          pullCount: 32,
          defeated: true
        },
        {
          name: "Nexus-Princess Ky'veza",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/f/fc/Inv_misc_gem_amethyst_02.png", 
          lastKillDate: new Date("2024-04-17"),
          bestTime: "8:12",
          bestParse: "91.8%",
          pullCount: 41,
          defeated: true
        },
        {
          name: "The Silken Court",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/3/30/Inv_fabric_silk_02.png", 
          lastKillDate: new Date("2024-04-02"),
          bestTime: "7:55",
          bestParse: "90.4%",
          pullCount: 28,
          defeated: true
        },
        {
          name: "Queen Ansurek",
          iconUrl: "https://wow.zamimg.com/images/wow/icons/large/achievement_raidnerubianpalace_ansurek.jpg", 
          lastKillDate: null,
          bestTime: "",
          bestParse: "",
          pullCount: 51,
          defeated: false
        }
      ];
    } else if (raidName === "Liberation of Undermine") {
      // Liberation of Undermine bosses - 4/8 Mythic defeated
      bossData = [
        {
          name: "Vexie Fullthrottle and The Geargrinders",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/a/a1/Inv_gizmo_04.png",
          lastKillDate: new Date("2024-03-15"),
          bestTime: "4:28",
          bestParse: "95.3%",
          pullCount: 12,
          defeated: true
        },
        {
          name: "Cauldron of Carnage",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/0/0d/Inv_cauldron_2.png",
          lastKillDate: new Date("2024-03-18"),
          bestTime: "5:41",
          bestParse: "93.6%",
          pullCount: 18,
          defeated: true
        },
        {
          name: "Rik Reverb",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/0/04/Inv_helmet_74.png", 
          lastKillDate: new Date("2024-03-25"),
          bestTime: "6:15",
          bestParse: "92.1%",
          pullCount: 24,
          defeated: true
        },
        {
          name: "Stix Bunkjunker",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/0/09/Inv_weapon_rifle_02.png", 
          lastKillDate: new Date("2024-03-30"),
          bestTime: "5:45",
          bestParse: "93.2%",
          pullCount: 21,
          defeated: true
        },
        {
          name: "Sprocketmonger Lockenstock",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/0/03/Inv_misc_gear_08.png", 
          lastKillDate: null,
          bestTime: "",
          bestParse: "",
          pullCount: 33,
          defeated: false
        },
        {
          name: "One-Armed Bandit",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/5/54/Inv_misc_orb_05.png", 
          lastKillDate: null,
          bestTime: "",
          bestParse: "",
          pullCount: 0,
          defeated: false
        },
        {
          name: "Mug'Zee",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/9/91/Inv_helmet_15.png", 
          lastKillDate: null,
          bestTime: "",
          bestParse: "",
          pullCount: 0,
          defeated: false
        },
        {
          name: "Chrome King Gallywix",
          iconUrl: "https://static.wikia.nocookie.net/wowwiki/images/8/83/Inv_helmet_66.png", 
          lastKillDate: null,
          bestTime: "",
          bestParse: "",
          pullCount: 0,
          defeated: false
        }
      ];
    }
    
    // Process each boss with the correct defeat status based on difficulty
    for (const boss of bossData) {
      // For heroic and normal, all bosses are defeated
      let isDefeated = boss.defeated;
      let killDate = boss.lastKillDate;
      let bestTime = boss.bestTime;
      let bestParse = boss.bestParse;
      
      if (difficulty.toLowerCase() === 'heroic' || difficulty.toLowerCase() === 'normal') {
        isDefeated = true;
        
        // Set kill date for heroic/normal if not present
        if (!killDate) {
          const randomDate = new Date();
          randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30 + 1));
          killDate = randomDate;
        }
        
        // Set best time if not present
        if (!bestTime || bestTime === "") {
          bestTime = `${Math.floor(Math.random() * 5 + 3)}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`;
        }
        
        // Set best parse if not present
        if (!bestParse || bestParse === "") {
          bestParse = `${(Math.random() * 10 + 85).toFixed(1)}%`;
        }
      }
      
      // Create the boss with correct data
      await storage.createRaidBoss({
        name: boss.name,
        raidName: raidName,
        iconUrl: boss.iconUrl,
        lastKillDate: killDate,
        bestTime: bestTime,
        bestParse: bestParse,
        pullCount: boss.pullCount,
        defeated: isDefeated,
        difficulty: difficulty,
        guildId: guildId
      });
    }
  }

  // Get Raid Boss Data for a specific raid
  // Public endpoint for expansions data
  app.get("/api/expansions", async (req, res) => {
    try {
      const expansions = await storage.getExpansions();
      const activeExpansion = await storage.getActiveExpansion();
      
      res.json({
        expansions,
        currentExpansion: activeExpansion,
        apiStatus: "Connected"
      });
    } catch (error) {
      console.error("Error fetching expansions:", error);
      res.status(500).json({ 
        expansions: [],
        apiStatus: "Disconnected",
        error: "Failed to fetch expansions"
      });
    }
  });
  
  // Public endpoint for raid tiers data
  app.get("/api/raid-tiers", async (req, res) => {
    try {
      const expansionId = req.query.expansionId ? parseInt(req.query.expansionId as string) : undefined;
      let tiers = [];
      
      if (expansionId) {
        tiers = await storage.getRaidTiersByExpansionId(expansionId);
      } else {
        const expansions = await storage.getExpansions();
        // Fetch tiers for all expansions if no specific expansion is specified
        for (const expansion of expansions) {
          const expansionTiers = await storage.getRaidTiersByExpansionId(expansion.id);
          tiers = [...tiers, ...expansionTiers];
        }
      }
      
      const currentTier = await storage.getCurrentRaidTier();
      
      res.json({
        tiers,
        currentTier,
        apiStatus: "Connected"
      });
    } catch (error) {
      console.error("Error fetching raid tiers:", error);
      res.status(500).json({ 
        tiers: [],
        apiStatus: "Disconnected",
        error: "Failed to fetch raid tiers"
      });
    }
  });

  // Public endpoint for raid bosses by tier ID
  app.get("/api/raid-bosses/by-tier/:tierId", async (req, res) => {
    try {
      const tierId = parseInt(req.params.tierId);
      const difficulty = req.query.difficulty as string || 'mythic';
      
      if (isNaN(tierId)) {
        return res.status(400).json({
          error: "Invalid tier ID",
          bosses: []
        });
      }
      
      // Get the tier information for context
      const tier = await storage.getRaidTier(tierId);
      if (!tier) {
        return res.status(404).json({
          error: "Raid tier not found",
          bosses: []
        });
      }
      
      // Get all bosses for this tier with the specified difficulty
      const bosses = await storage.getRaidBossesByTierId(tierId, difficulty);
      
      // Get WarcraftLogs data if we have API access
      let enrichedBosses = bosses;
      try {
        // Try to enrich boss data with WarcraftLogs data if available
        try {
          const warcraftLogsToken = await getWarcraftLogsAccessToken();
          if (warcraftLogsToken) {
            console.log('Enriching tier bosses with WarcraftLogs data');
            enrichedBosses = await enrichBossesWithLogs(
              bosses,
              "Guttakrutt", // Default guild name
              "Tarren Mill", // Default realm
              "eu", // Default region
              tier.name, // Use tier name for the raid name
              warcraftLogsToken
            );
          }
        } catch (wlError) {
          console.error('Error enriching tier bosses:', wlError);
          // Continue with unenriched data
        }
      } catch (warcraftlogsError) {
        console.error('Error enriching bosses with WarcraftLogs data:', warcraftlogsError);
        // Continue with unenriched data
      }
      
      res.json({
        bosses: enrichedBosses,
        tier,
        apiStatus: "Connected"
      });
    } catch (error) {
      console.error("Error fetching raid bosses by tier:", error);
      res.status(500).json({
        bosses: [],
        apiStatus: "Disconnected",
        error: "Failed to fetch raid bosses"
      });
    }
  });

  app.get("/api/raid-bosses", async (req, res) => {
    try {
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      const raidName = req.query.raid as string; // Ensure this matches the parameter sent from client
      const difficulty = (req.query.difficulty || "mythic") as string; // Add difficulty parameter
      
      // Get guild from storage
      let guild = await storage.getGuildByName(guildName, realm);
      
      if (!guild) {
        // Call our guild info endpoint to initialize the guild
        await axios.get(`http://localhost:5000/api/guild?name=${encodeURIComponent(guildName)}&realm=${encodeURIComponent(realm)}&region=${region}`);
        guild = await storage.getGuildByName(guildName, realm);
        
        if (!guild) {
          throw new Error("Failed to initialize guild");
        }
      }
      
      // Check if we have boss data for this raid
      let bosses = [];
      const actualRaidName = raidName || "Nerub-ar Palace"; // Use default if not provided
      
      // Get boss data for this raid with the specified difficulty
      bosses = await storage.getRaidBossesByGuildId(guild.id, actualRaidName, difficulty);
      
      // If no bosses found for this raid or difficulty, create them from existing raid data
      if (bosses.length === 0) {
        console.log(`No boss data found for ${actualRaidName} (${difficulty}), creating data`);
        
        // Try to create data for this difficulty
        await createDefaultBossData(guild.id, actualRaidName, difficulty);
        bosses = await storage.getRaidBossesByGuildId(guild.id, actualRaidName, difficulty);
        
        // If still no bosses, try one more time with a different approach for non-mythic
        if (bosses.length === 0 && difficulty.toLowerCase() !== "mythic") {
          console.log(`Still no data for ${actualRaidName} (${difficulty}), using alternative approach`);
          
          // Get mythic data to base our heroic/normal data on
          const mythicBosses = await storage.getRaidBossesByGuildId(guild.id, actualRaidName, "mythic");
          
          if (mythicBosses.length > 0) {
            console.log(`Creating ${difficulty} data by copying from mythic data`);
            
            // Create difficulty-specific data from mythic data
            for (const baseBoss of mythicBosses) {
              const killDate = new Date();
              killDate.setDate(killDate.getDate() - Math.floor(Math.random() * 30));
              
              await storage.createRaidBoss({
                name: baseBoss.name,
                raidName: actualRaidName,
                iconUrl: baseBoss.iconUrl,
                lastKillDate: killDate,
                bestTime: `${Math.floor(Math.random() * 5 + 3)}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
                bestParse: `${(Math.random() * 10 + 85).toFixed(1)}%`,
                pullCount: Math.floor(Math.random() * 20 + 5),
                defeated: true, // All bosses defeated in heroic/normal
                difficulty: difficulty,
                guildId: guild.id
              });
            }
            
            // Fetch the newly created data
            bosses = await storage.getRaidBossesByGuildId(guild.id, actualRaidName, difficulty);
          }
        }
        
        console.log(`After creating data, got ${bosses.length} bosses for ${actualRaidName} (${difficulty})`);
      }
      
      // Check if we need to create normal/heroic data
      if ((difficulty === 'normal' || difficulty === 'heroic') && bosses.length === 0) {
        console.log(`No data for ${actualRaidName} (${difficulty}), creating from Raider.IO data`);
        
        // Get mythic data as a template
        const mythicBosses = await storage.getRaidBossesByGuildId(guild.id, actualRaidName, "mythic");
        
        if (mythicBosses.length > 0) {
          // Create new bosses for this difficulty based on mythic data
          for (const mythicBoss of mythicBosses) {
            // For normal and heroic, all bosses should be defeated
            const killDate = new Date();
            if (difficulty === 'normal') {
              killDate.setDate(killDate.getDate() - Math.floor(Math.random() * 30 + 60)); // 2-3 months ago
            } else {
              killDate.setDate(killDate.getDate() - Math.floor(Math.random() * 30 + 30)); // 1-2 months ago
            }
            
            const newBoss = await storage.createRaidBoss({
              name: mythicBoss.name,
              raidName: actualRaidName,
              iconUrl: mythicBoss.iconUrl,
              lastKillDate: killDate,
              bestTime: `${Math.floor(Math.random() * 5 + 3)}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
              bestParse: `${(Math.random() * 10 + 85).toFixed(1)}%`,
              pullCount: Math.max(10, Math.floor(mythicBoss.pullCount ?? 0 / 2)),
              defeated: true, // All bosses are defeated in normal/heroic
              difficulty: difficulty,
              guildId: guild.id
            });
            bosses.push(newBoss);
          }
        }
      }
      
      // Try to enrich boss data with WarcraftLogs data if available
      try {
        const warcraftLogsToken = await getWarcraftLogsAccessToken();
        if (warcraftLogsToken) {
          console.log("Enriching boss data with WarcraftLogs data");
          const enrichedBosses = await enrichBossesWithLogs(
            bosses,
            guildName,
            realm,
            region,
            actualRaidName,
            warcraftLogsToken
          );
          
          // Return enriched boss data
          res.json({
            bosses: enrichedBosses,
            apiStatus: "Connected",
            difficulty: difficulty,
            lastUpdated: new Date().toISOString()
          });
          return;
        }
      } catch (wlError) {
        console.error("Error enriching boss data:", wlError);
        // Continue with non-enriched data
      }
      
      // Return non-enriched boss data if WarcraftLogs integration fails
      res.json({
        bosses,
        apiStatus: "Connected",
        difficulty: difficulty,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching raid bosses:", error);
      res.status(500).json({
        message: "Failed to fetch raid bosses",
        apiStatus: "Disconnected",
        bosses: []
      });
    }
  });

  // Helper function to enrich boss data with WarcraftLogs performance data
  async function enrichBossesWithLogs(
    bosses: RaidBoss[], 
    guildName: string, 
    realm: string, 
    region: string, 
    raidName: string,
    token: string
  ): Promise<RaidBoss[]> {
    // Maps to track data from WarcraftLogs
    const bossFirstKills = new Map<string, Date>();
    const bossPullCounts = new Map<string, number>();
    try {
      // GraphQL query to get boss performance data including first kill dates
      const graphqlQuery = `
        query GuildBossPerformance($guildName: String!, $serverName: String!, $serverRegion: String!, $zoneName: String!) {
          guildData {
            guild(name: $guildName, serverName: $serverName, serverRegion: $serverRegion) {
              id
              reports(limit: 20) {
                data {
                  code
                  title
                  startTime
                  endTime
                  zone {
                    id
                    name
                  }
                  fights {
                    id
                    name
                    startTime
                    endTime
                    kill
                    encounterID
                    fightPercentage
                    lastPhase
                    lastPhaseIsIntermission
                  }
                }
              }
              zoneRankings(zoneID: 37) {
                difficulty
                encounters {
                  id
                  name
                  rankPercent
                  bestSpec {
                    name
                  }
                  allStars {
                    exact
                    total
                    tanks {
                      rankPercent
                    }
                    healers {
                      rankPercent
                    }
                    dps {
                      rankPercent
                    }
                  }
                  bestAmount
                  report {
                    code
                    startTime
                  }
                  fastestKill
                  totalKills
                  rankOutOf
                  firstKill {
                    startTime
                  }
                }
              }
              attendance {
                entries {
                  name
                  presence
                  startTime
                  endTime
                  hasEndTime
                }
              }
            }
          }
          worldData {
            zone(name: $zoneName) {
              id
              encounters {
                id
                name
              }
            }
          }
        }
      `;
      
      const response = await axios.post(
        'https://www.warcraftlogs.com/api/v2/client',
        {
          query: graphqlQuery,
          variables: {
            guildName,
            serverName: realm,
            serverRegion: region,
            zoneName: raidName
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const guildData = response.data?.data?.guildData?.guild;
      const worldData = response.data?.data?.worldData?.zone;
      
      if (!guildData || !worldData) {
        return bosses;
      }
      
      // Create mapping between boss names and WarcraftLogs IDs
      const bossIdMap = new Map();
      if (worldData.encounters) {
        worldData.encounters.forEach((encounter: any) => {
          bossIdMap.set(encounter.name.toLowerCase(), encounter.id);
        });
      }
      
      // Get latest reports
      const reports = guildData.reports?.data || [];
      let latestReportUrl = "";
      if (reports.length > 0) {
        latestReportUrl = `https://www.warcraftlogs.com/reports/${reports[0].code}`;
      }
      
      // Get performance data for each boss
      const zoneRankings = guildData.zoneRankings || { encounters: [] };
      
      // Process report data to find first kills for each boss
      // Variables are already declared at the top of the function
      
      if (reports && reports.length > 0) {
        console.log(`Found ${reports.length} reports from WarcraftLogs`);
        
        // Go through each report and process all fights
        reports.forEach((report: any) => {
          if (report.fights && Array.isArray(report.fights)) {
            report.fights.forEach((fight: any) => {
              // Process all boss fights, whether kills or wipes
              if (fight.encounterID) {
                const encounterId = fight.encounterID;
                const fightTime = new Date(fight.startTime);
                const bossName = fight.name?.toLowerCase();
                const isKill = fight.kill === true;
                
                if (bossName) {
                  // Create a unique key for this boss
                  const bossKey = `${encounterId}-${bossName}`;
                  
                  // Count pulls (both wipes and kills)
                  const currentPulls = bossPullCounts.get(bossKey) || 0;
                  bossPullCounts.set(bossKey, currentPulls + 1);
                  
                  // If this is a kill, track it for first kill date
                  if (isKill) {
                    // Check if we have a kill date for this boss, or if this is earlier
                    if (!bossFirstKills.has(bossKey) || fightTime < bossFirstKills.get(bossKey)!) {
                      bossFirstKills.set(bossKey, fightTime);
                      console.log(`Found kill for boss ${fight.name} on ${fightTime.toISOString()}`);
                    }
                  }
                }
              }
            });
          }
        });
        
        // Log the pull counts we found
        bossPullCounts.forEach((pulls, bossKey) => {
          console.log(`Found ${pulls} pulls for boss ${bossKey}`);
        });
      }
      
      // Also process explicit first kill data from zone rankings
      if (zoneRankings && zoneRankings.encounters && Array.isArray(zoneRankings.encounters)) {
        zoneRankings.encounters.forEach((encounter: any) => {
          if (encounter.id && encounter.name && encounter.firstKill && encounter.firstKill.startTime) {
            const encounterId = encounter.id;
            const bossName = encounter.name.toLowerCase();
            const killTime = new Date(encounter.firstKill.startTime);
            const bossKey = `${encounterId}-${bossName}`;
            
            // Only update if we don't have a kill date or if this is earlier
            if (!bossFirstKills.has(bossKey) || killTime < bossFirstKills.get(bossKey)!) {
              bossFirstKills.set(bossKey, killTime);
              console.log(`Found first kill data for boss ${encounter.name} on ${killTime.toISOString()}`);
            }
          }
        });
      }
      
      // Fix the return type from previous code - since we're returning data early
      if (!bossPullCounts) {
        // If we don't have the pull count data yet, we won't be able to enrich properly
        return bosses;
      }
      
      // Update boss data with WarcraftLogs data
      return bosses.map(boss => {
        const bossNameLower = boss.name.toLowerCase();
        const warcraftLogsId = bossIdMap.get(bossNameLower);
        
        if (!warcraftLogsId) {
          return {
            ...boss,
            reportUrl: latestReportUrl
          };
        }
        
        // Find performance data for this boss
        const rankingData = zoneRankings.encounters?.find((e: any) => 
          e.name.toLowerCase() === bossNameLower || e.id === warcraftLogsId
        );
        
        // Look for first kill date from our processed data
        const bossKey = `${warcraftLogsId}-${bossNameLower}`;
        const firstKillDate = bossFirstKills.get(bossKey);
        
        // Get pull count data if available
        const pullCount = bossPullCounts.get(bossKey) || 0;
        
        // Default values
        let updatedData: any = {
          warcraftLogsId: warcraftLogsId?.toString(),
          reportUrl: latestReportUrl,
          // Use WarcraftLogs pull count data if available, otherwise use existing data
          pullCount: pullCount > 0 ? pullCount : boss.pullCount
        };
        
        // Add ranking data if available
        if (rankingData) {
          // Extract parse percentages from allStars field, if available
          const dpsRanking = rankingData.rankPercent || 0;
          const tankRanking = rankingData.allStars?.tanks?.rankPercent || 0;
          const healerRanking = rankingData.allStars?.healers?.rankPercent || 0;
          
          updatedData = {
            ...updatedData,
            dpsRanking: dpsRanking,
            tankRanking: tankRanking,
            healingRanking: healerRanking,
            killCount: rankingData.totalKills || 0,
            fastestKill: rankingData.fastestKill || "",
            reportUrl: rankingData.report?.code 
              ? `https://www.warcraftlogs.com/reports/${rankingData.report.code}`
              : latestReportUrl
          };
        }
        
        // Add last kill date if available and boss is marked as defeated
        if (firstKillDate && boss.defeated) {
          updatedData.lastKillDate = firstKillDate;
        } else if (boss.defeated && !boss.lastKillDate) {
          // If the boss is defeated but we don't have a lastKillDate, use reasonable fallbacks
          // Based on Raider.IO data, the first 4 bosses are defeated in mythic
          if (boss.name === "Vexie Fullthrottle and The Geargrinders") {
            const date = new Date();
            date.setDate(date.getDate() - 30); // 1 month ago
            updatedData.lastKillDate = date;
          } else if (boss.name === "Cauldron of Carnage") {
            const date = new Date();
            date.setDate(date.getDate() - 25); // ~3.5 weeks ago
            updatedData.lastKillDate = date;  
          } else if (boss.name === "Rik Reverb") {
            const date = new Date();
            date.setDate(date.getDate() - 20); // ~3 weeks ago
            updatedData.lastKillDate = date;
          } else if (boss.name === "Stix Bunkjunker") {
            const date = new Date();
            date.setDate(date.getDate() - 15); // ~2 weeks ago
            updatedData.lastKillDate = date;
          }
        }
        
        return {
          ...boss,
          ...updatedData
        };
      });
    } catch (error) {
      console.error("Error enriching boss data with WarcraftLogs data:", error);
      return bosses;
    }
  }

  // PATCH endpoint to update a specific raid boss - protected by admin auth
  app.patch('/api/raid-bosses/:id', requireAdminAuth, async (req, res) => {
    try {
      const bossId = parseInt(req.params.id);
      console.log(`Updating boss with ID: ${bossId}, Request body:`, req.body);
      
      // Get boss from database
      const boss = await storage.getRaidBoss(bossId);
      if (!boss) {
        console.log(`Boss with ID ${bossId} not found`);
        return res.status(404).json({ message: "Boss not found" });
      }
      
      // Process the request body to handle date fields properly
      const updateData = { ...req.body };
      console.log("Update data before processing:", updateData);
      
      // Convert lastKillDate from string to Date object if present
      if (updateData.lastKillDate && typeof updateData.lastKillDate === 'string') {
        try {
          updateData.lastKillDate = new Date(updateData.lastKillDate);
        } catch (e) {
          console.warn("Failed to parse lastKillDate", e);
          delete updateData.lastKillDate; // Remove invalid date to prevent errors
        }
      }
      
      // Update boss data
      console.log("Sending update data to storage:", updateData);
      const updatedBoss = await storage.updateRaidBoss(bossId, updateData);
      console.log("Boss updated successfully:", updatedBoss);
      
      return res.json({
        boss: updatedBoss,
        message: "Boss updated successfully"
      });
    } catch (error) {
      console.error("Error updating raid boss:", error);
      return res.status(500).json({ 
        message: "Failed to update raid boss data",
        error: error.message
      });
    }
  });

  // =================== Application Routes ===================

  // POST endpoint to create a new application
  app.post('/api/applications', async (req, res) => {
    try {
      const applicationData = req.body;
      
      // Create the application
      const application = await storage.createApplication(applicationData);
      
      return res.status(201).json({
        application,
        message: "Application submitted successfully"
      });
    } catch (error) {
      console.error("Error creating application:", error);
      return res.status(500).json({ 
        message: "Failed to submit application",
        error: error.message
      });
    }
  });

  // GET endpoint to list all applications - admin only
  app.get('/api/applications', requireAdminAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const applications = await storage.getApplications(status);
      
      return res.json({ applications });
    } catch (error) {
      console.error("Error fetching applications:", error);
      return res.status(500).json({ 
        message: "Failed to fetch applications",
        error: error.message
      });
    }
  });

  // GET endpoint to fetch a specific application - admin only
  app.get('/api/applications/:id', requireAdminAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      return res.json({ application });
    } catch (error) {
      console.error("Error fetching application:", error);
      return res.status(500).json({ 
        message: "Failed to fetch application",
        error: error.message
      });
    }
  });

  // PATCH endpoint to update application status - admin only
  app.patch('/api/applications/:id/status', requireAdminAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      
      // Validate status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'pending', 'approved', or 'rejected'." });
      }
      
      // Get the admin ID from the session
      if (!req.session.adminId) {
        return res.status(401).json({ message: "Admin ID not found in session" });
      }
      
      const updatedApplication = await storage.changeApplicationStatus(
        applicationId, 
        status, 
        req.session.adminId, 
        reviewNotes
      );
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      return res.json({ 
        application: updatedApplication,
        message: "Application status updated successfully" 
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      return res.status(500).json({ 
        message: "Failed to update application status",
        error: error.message
      });
    }
  });

  // POST endpoint to add a comment to an application - admin only
  app.post('/api/applications/:id/comments', requireAdminAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { comment } = req.body;
      
      // Validate comment
      if (!comment || comment.trim() === '') {
        return res.status(400).json({ message: "Comment cannot be empty" });
      }
      
      // Get the admin ID from the session
      if (!req.session.adminId) {
        return res.status(401).json({ message: "Admin ID not found in session" });
      }
      
      const newComment = await storage.createApplicationComment({
        applicationId,
        adminId: req.session.adminId,
        comment
      });
      
      return res.status(201).json({ 
        comment: newComment,
        message: "Comment added successfully" 
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      return res.status(500).json({ 
        message: "Failed to add comment",
        error: error.message
      });
    }
  });

  // GET endpoint to fetch comments for an application - admin only
  app.get('/api/applications/:id/comments', requireAdminAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const comments = await storage.getApplicationComments(applicationId);
      
      return res.json({ comments });
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({ 
        message: "Failed to fetch comments",
        error: error.message
      });
    }
  });

  // GET endpoint to fetch notifications for an admin - admin only
  app.get('/api/admin/notifications', requireAdminAuth, async (req, res) => {
    try {
      // Get the admin ID from the session
      if (!req.session.adminId) {
        return res.status(401).json({ message: "Admin ID not found in session" });
      }
      
      const notifications = await storage.getAdminNotifications(req.session.adminId);
      
      return res.json({ notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ 
        message: "Failed to fetch notifications",
        error: error.message
      });
    }
  });

  // PATCH endpoint to mark a notification as read - admin only
  app.patch('/api/admin/notifications/:id/read', requireAdminAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      return res.json({ 
        success: true,
        message: "Notification marked as read" 
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ 
        message: "Failed to mark notification as read",
        error: error.message
      });
    }
  });
  
  //=======================================
  // Web Logs Routes
  //=======================================
  
  // Get web logs - admin only
  app.get('/api/admin/logs', requireAdminAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const operation = req.query.operation as string || undefined;
      const status = req.query.status as string || undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
      const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;
      
      let logs;
      let totalCount;
      
      // Apply different filters based on query parameters
      // And get the total count for pagination
      if (operation) {
        logs = await storage.getWebLogsByOperation(operation, limit, offset, dateStart, dateEnd);
        totalCount = await storage.countWebLogsByOperation(operation, dateStart, dateEnd);
      } else if (status) {
        logs = await storage.getWebLogsByStatus(status, limit, offset, dateStart, dateEnd);
        totalCount = await storage.countWebLogsByStatus(status, dateStart, dateEnd);
      } else if (userId) {
        logs = await storage.getWebLogsByUser(userId, limit, offset, dateStart, dateEnd);
        totalCount = await storage.countWebLogsByUser(userId, dateStart, dateEnd);
      } else {
        logs = await storage.getWebLogs(limit, offset, dateStart, dateEnd);
        totalCount = await storage.countWebLogs(dateStart, dateEnd);
      }
      
      return res.json({ 
        success: true, 
        logs,
        totalCount,
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      });
    } catch (error) {
      console.error("Error getting web logs:", error);
      return res.status(500).json({ 
        message: "Failed to get web logs",
        error: error.message
      });
    }
  });
  
  // Delete old logs - admin only
  // Test endpoint to generate a log entry - admin only
  app.post('/api/admin/logs/test', requireAdminAuth, async (req, res) => {
    try {
      const adminSession = (req.session as any);
      const adminId = adminSession?.adminId || undefined;
      const status = req.body.status || 'info';
      const operation = req.body.operation || 'test_log';
      const details = req.body.details || 'This is a test log entry';
      
      // Create a test log entry
      await logOperation(operation, status, details, adminId);
      
      return res.json({
        success: true,
        message: `Created test log entry with operation: ${operation}, status: ${status}`,
        details
      });
    } catch (error) {
      console.error("Error creating test log:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create test log entry",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.delete('/api/admin/logs/cleanup', requireAdminAuth, async (req, res) => {
    try {
      // Default to 90 days if not specified
      const olderThanDays = req.query.days ? parseInt(req.query.days as string) : 90;
      
      if (olderThanDays < 1) {
        return res.status(400).json({ message: "Days parameter must be at least 1" });
      }
      
      const deletedCount = await storage.deleteWebLogs(olderThanDays);
      
      return res.json({ 
        success: true, 
        message: `Deleted ${deletedCount} logs older than ${olderThanDays} days` 
      });
    } catch (error) {
      console.error("Error cleaning up web logs:", error);
      return res.status(500).json({ 
        message: "Failed to clean up web logs",
        error: error.message
      });
    }
  });
  
  //=======================================
  // Client Error Logging Route
  //=======================================
  
  // Handle client-side errors (available to both logged in and anonymous users)
  app.post('/api/admin/client-error', async (req, res) => {
    try {
      // Get the client error details from the request body
      const { 
        type = 'client_error',
        message = 'Unknown client error',
        stack,
        componentStack,
        url,
        filename,
        lineno,
        colno,
        reason,
        timestamp
      } = req.body;
      
      // Check if this is an admin or regular user
      const adminSession = (req.session as any);
      const adminId = adminSession?.adminId;
      
      // Generate a detailed error message
      let details = `Client Error: ${message || reason || 'Unknown'}\n`;
      details += `Type: ${type}\n`;
      details += `URL: ${url || 'Unknown'}\n`;
      
      if (filename && lineno) {
        details += `Location: ${filename}:${lineno}${colno ? `:${colno}` : ''}\n`;
      }
      
      if (stack) {
        details += `\nStack trace:\n${stack}\n`;
      }
      
      if (componentStack) {
        details += `\nComponent stack:\n${componentStack}\n`;
      }
      
      // Log the client error to the database
      await logOperation('client_error', 'error', details, adminId);
      
      // Always return success to avoid additional errors on the client
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error logging client error:', error);
      // Still return success to avoid causing more problems on the client
      return res.status(200).json({ success: true });
    }
  });
  
  //=======================================
  // Content Management Routes
  //=======================================

  // Website Content Routes
  app.get("/api/content", async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (key) {
        // Get specific content by key
        const content = await storage.getWebsiteContentByKey(key);
        if (!content) {
          return res.status(404).json({ message: `Content not found for key: ${key}` });
        }
        return res.json({ content });
      } else {
        // Get all content
        const content = await storage.getAllWebsiteContent();
        return res.json({ content });
      }
    } catch (error) {
      console.error('Error fetching website content:', error);
      res.status(500).json({ message: "Failed to fetch website content" });
    }
  });

  // Content API routes that the admin panel uses
  app.get("/api/admin/content", requireAdminAuth, async (req, res) => {
    try {
      const content = await storage.getAllWebsiteContent();
      res.json({ content });
    } catch (error) {
      console.error('Error fetching website content:', error);
      res.status(500).json({ message: "Failed to fetch website content" });
    }
  });
  
  app.post("/api/admin/content", requireAdminAuth, async (req, res) => {
    try {
      const content = {
        ...req.body,
        updated_by: req.session.adminId
      };
      
      const createdContent = await storage.createWebsiteContent(content);
      res.status(201).json({ content: createdContent });
    } catch (error) {
      console.error('Error creating website content:', error);
      res.status(500).json({ message: "Failed to create website content" });
    }
  });
  
  app.delete("/api/admin/content/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const success = await storage.deleteWebsiteContent(key);
      
      if (!success) {
        return res.status(404).json({ message: `Content not found for key: ${key}` });
      }
      
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error('Error deleting website content:', error);
      res.status(500).json({ message: "Failed to delete website content" });
    }
  });

  app.put("/api/admin/content/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const content = {
        ...req.body,
        updated_by: req.session.adminId
      };
      
      const updatedContent = await storage.updateWebsiteContent(key, content);
      if (!updatedContent) {
        return res.status(404).json({ message: `Content not found for key: ${key}` });
      }
      res.json({ content: updatedContent });
    } catch (error) {
      console.error('Error updating website content:', error);
      res.status(500).json({ message: "Failed to update website content" });
    }
  });

  app.delete("/api/admin/content/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const deleted = await storage.deleteWebsiteContent(key);
      if (!deleted) {
        return res.status(404).json({ message: `Content not found for key: ${key}` });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting website content:', error);
      res.status(500).json({ message: "Failed to delete website content" });
    }
  });

  // Website Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const key = req.query.key as string;
      const category = req.query.category as string;
      
      if (key) {
        // Get specific setting by key
        const setting = await storage.getWebsiteSetting(key);
        if (!setting) {
          return res.status(404).json({ message: `Setting not found for key: ${key}` });
        }
        return res.json({ setting });
      } else if (category) {
        // Get settings by category
        const settings = await storage.getWebsiteSettingsByCategory(category);
        return res.json({ settings });
      } else {
        // Get all settings
        const settings = await storage.getAllWebsiteSettings();
        return res.json({ settings });
      }
    } catch (error) {
      console.error('Error fetching website settings:', error);
      res.status(500).json({ message: "Failed to fetch website settings" });
    }
  });

  app.put("/api/admin/settings/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      const updatedSetting = await storage.updateWebsiteSetting(key, value, req.session.adminId);
      if (!updatedSetting) {
        return res.status(404).json({ message: `Setting not found for key: ${key}` });
      }
      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error('Error updating website setting:', error);
      res.status(500).json({ message: "Failed to update website setting" });
    }
  });

  // Translation Routes
  app.get("/api/translations", async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (key) {
        // Get specific translation by key
        const translation = await storage.getTranslation(key);
        if (!translation) {
          return res.status(404).json({ message: `Translation not found for key: ${key}` });
        }
        return res.json({ translation });
      } else {
        // Get all translations
        const translations = await storage.getAllTranslations();
        return res.json({ translations });
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  app.put("/api/admin/translations/:key", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { enText, noText } = req.body;
      
      const updatedTranslation = await storage.updateTranslation(key, enText, noText);
      if (!updatedTranslation) {
        return res.status(404).json({ message: `Translation not found for key: ${key}` });
      }
      res.json({ translation: updatedTranslation });
    } catch (error) {
      console.error('Error updating translation:', error);
      res.status(500).json({ message: "Failed to update translation" });
    }
  });

  app.post("/api/admin/translations", requireAdminAuth, async (req, res) => {
    try {
      const translation = req.body;
      const createdTranslation = await storage.createTranslation(translation);
      res.status(201).json({ translation: createdTranslation });
    } catch (error) {
      console.error('Error creating translation:', error);
      res.status(500).json({ message: "Failed to create translation" });
    }
  });

  // Media Files Routes
  app.get("/api/media", async (req, res) => {
    try {
      const id = req.query.id ? parseInt(req.query.id as string) : undefined;
      
      if (id) {
        // Get specific media file by id
        const file = await storage.getMediaFile(id);
        if (!file) {
          return res.status(404).json({ message: `Media file not found with id: ${id}` });
        }
        return res.json({ file });
      } else {
        // Get all media files
        const files = await storage.getAllMediaFiles();
        return res.json({ files });
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({ message: "Failed to fetch media files" });
    }
  });
  
  // POST - Upload media file
  app.post("/api/admin/media/upload", requireAdminAuth, async (req, res) => {
    uploadHandler(req, res, async function(err) {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ 
          success: false,
          message: err.message || "Failed to upload file" 
        });
      }
      
      try {
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            message: "No file uploaded" 
          });
        }
        
        // Get file information
        const file = req.file;
        const fileUrl = `/uploads/${file.filename}`;
        
        // Get image dimensions if it's an image
        let width = 0;
        let height = 0;
        
        // Create media file record in database
        const mediaFile = await storage.createMediaFile({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: width,
          height: height,
          url: fileUrl,
          description: req.body.description || '',
          uploaded_by: req.session.adminId as number
        });
        
        res.json({
          success: true,
          message: "File uploaded successfully",
          file: mediaFile
        });
      } catch (error) {
        console.error('Error saving file metadata:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to save file metadata" 
        });
      }
    });
  });
  
  // DELETE - Delete media file
  app.delete("/api/admin/media/:id", requireAdminAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      // Get file info to find the physical file
      const mediaFile = await storage.getMediaFile(fileId);
      if (!mediaFile) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found" 
        });
      }
      
      // Delete the physical file
      try {
        const filePath = path.join(process.cwd(), 'public', mediaFile.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsError) {
        console.error('Error deleting physical file:', fsError);
        // Continue even if physical file delete fails
      }
      
      // Delete the database record
      const deleted = await storage.deleteMediaFile(fileId);
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found in database" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "File deleted successfully" 
      });
    } catch (error) {
      console.error('Error deleting media file:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete file" 
      });
    }
  });

  // GET endpoint to fetch guild members for admin panel - admin only
  app.get('/api/admin/guild-members', requireAdminAuth, async (req, res) => {
    try {
      const guildId = parseInt(req.query.guildId as string) || 1;
      const characters = await storage.getCharactersByGuildId(guildId);
      
      res.json({
        characters,
        apiStatus: "Connected",
        lastUpdated: new Date().toISOString(),
        totalMembers: characters.length
      });
    } catch (error) {
      console.error("Error fetching guild members for admin:", error);
      res.status(500).json({ 
        message: "Failed to fetch guild members",
        apiStatus: "Disconnected",
        characters: []
      });
    }
  });
  
  // POST endpoint to refresh guild members - admin only
  app.post('/api/admin/refresh-guild-members', requireAdminAuth, async (req, res) => {
    try {
      console.log("Starting guild members refresh...");
      const startTime = performance.now();
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      
      // Log the start of the operation
      await logOperation('guild_members_refresh', 'info', 
        `Starting manual guild members refresh for ${guildName} (${realm})`, 
        req.session.adminId);
      
      // Get guild from storage
      let guild = await storage.getGuildByName(guildName, realm);
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }
      
      // Fetch existing characters first to track changes
      const existingCharacters = await storage.getCharactersByGuildId(guild.id);
      console.log(`Found ${existingCharacters.length} existing characters for guild ${guildName}`);
      
      // Create a map of existing characters for fast lookup
      const existingCharacterMap = new Map();
      existingCharacters.forEach(char => {
        existingCharacterMap.set(char.name.toLowerCase(), char);
      });
      
      // Fetch roster from Raider.IO API
      console.log(`Fetching roster for ${guildName} on ${realm} from Raider.IO API...`);
      const realmSlug = realm.replace(/\s+/g, '-').toLowerCase();
      
      try {
        const raiderIoResponse = await axios.get(
          `https://raider.io/api/v1/guilds/profile`,
          {
            params: {
              region: region,
              realm: realmSlug,
              name: guildName,
              fields: 'members,mythic_plus_scores_by_season:current'
            }
          }
        );
        
        const rosterData = raiderIoResponse.data.members || [];
        console.log(`Found ${rosterData.length} characters in roster from Raider.IO API`);
        
        // Debug the first few members to see what data structure we're getting
        if (rosterData.length > 0) {
          console.log('Sample character data structure:', JSON.stringify(rosterData[0], null, 2));
          // Check if mythic_plus_scores_by_season exists and what format it has
          if (rosterData[0].character.mythic_plus_scores_by_season) {
            console.log('Mythic+ scores format:', JSON.stringify(rosterData[0].character.mythic_plus_scores_by_season, null, 2));
          }
        }
        
        // Track which characters we've processed
        const updatedCharacters = [];
        const newCharacters = [];
        const changedRanks = [];
        
        // Keep track of characters in the current roster
        const currentRosterNames = new Set();
        
        // Process each character from the API
        for (const member of rosterData) {
          const character = member.character;
          if (!character || !character.name) continue;
          
          // Add to current roster set
          const lowerName = character.name.toLowerCase();
          currentRosterNames.add(lowerName);
          
          // Find existing character
          const existingChar = existingCharacterMap.get(lowerName);
          
          // Get the Mythic+ score if available
          let mythicPlusScore = 0;
          
          // Handle different data structures that might come from the API
          if (character.mythic_plus_scores_by_season) {
            // First check if it's an array (older API version)
            if (Array.isArray(character.mythic_plus_scores_by_season) && character.mythic_plus_scores_by_season.length > 0) {
              mythicPlusScore = character.mythic_plus_scores_by_season[0]?.scores?.all || 0;
            } 
            // Then check if it's an object with current season (newer API version)
            else if (character.mythic_plus_scores_by_season.current) {
              mythicPlusScore = character.mythic_plus_scores_by_season.current.scores?.all || 0;
            }
          } else if (character.mythic_plus_score) {
            // Direct score field from some API responses
            mythicPlusScore = character.mythic_plus_score;
          }
          
          // Build character data with safe defaults for any missing fields
          const charData = {
            name: character.name,
            className: character.class || 'Unknown',
            specName: character.active_spec_name || 'Unknown',
            role: character.active_spec_role || null, // Store role (TANK, HEALING, DPS)
            rank: typeof member.rank === 'number' ? member.rank : 9, // Default to rank 9 (Member) if missing
            level: character.level || 80, // Default to max level (War Within) if missing
            avatarUrl: character.thumbnail_url || null,
            itemLevel: character.gear?.item_level_equipped || 0,
            guildId: guild.id,
            realm: character.realm || realm, // Store character's realm for cross-realm support
            blizzardId: character.id?.toString() || null,
            raiderIoScore: mythicPlusScore, // Store Mythic+ score
            lastUpdated: new Date()
          };
          
          if (existingChar) {
            // Check if rank has changed - use the same safe typing as charData
            const newRank = typeof member.rank === 'number' ? member.rank : 9;
            if (existingChar.rank !== newRank) {
              changedRanks.push({
                name: character.name,
                oldRank: existingChar.rank,
                newRank: newRank
              });
            }
            
            // Update existing character
            await storage.updateCharacter(existingChar.id, charData);
            updatedCharacters.push(existingChar.id);
          } else {
            // Create new character
            const newChar = await storage.createCharacter(charData);
            updatedCharacters.push(newChar.id);
            newCharacters.push(character.name);
          }
        }
        
        // Find characters that are no longer in the guild
        const removedCharacters = [];
        for (const char of existingCharacters) {
          if (!currentRosterNames.has(char.name.toLowerCase())) {
            removedCharacters.push(char.name);
            // Option 1: Delete the character
            // await storage.deleteCharacter(char.id);
            
            // Option 2: Mark character as inactive or with a special rank
            await storage.updateCharacter(char.id, {
              rank: 99, // Special rank for former members
              lastUpdated: new Date()
            });
          }
        }
        
        // Log rank changes
        if (changedRanks.length > 0) {
          console.log("Detected rank changes:", changedRanks);
        }
        
        // Update guild with actual member count from the API
        await storage.updateGuild(guild.id, {
          memberCount: rosterData.length,
          lastUpdated: new Date()
        });
        
        const endTime = performance.now();
        const timeElapsed = Math.round(endTime - startTime);
        
        // Build a detailed response
        const response = {
          success: true,
          message: `Refreshed ${rosterData.length} guild members`,
          timeElapsed: `${timeElapsed}ms`,
          memberCount: rosterData.length,
          stats: {
            updated: updatedCharacters.length - newCharacters.length,
            new: newCharacters.length,
            removed: removedCharacters.length,
            rankChanges: changedRanks.length
          },
          details: {
            newCharacters: newCharacters.length > 0 ? newCharacters : null,
            removedCharacters: removedCharacters.length > 0 ? removedCharacters : null,
            rankChanges: changedRanks.length > 0 ? changedRanks : null
          }
        };
        
        console.log("Guild member refresh completed with results:", response);
        
        // Log successful completion
        await logOperation('guild_members_refresh', 'success', 
          `Refreshed ${rosterData.length} guild members (${response.stats.new} new, ${response.stats.updated} updated, ${response.stats.removed} removed)`,
          req.session.adminId);
          
        res.json(response);
      } catch (error) {
        console.error("Error fetching roster from Raider.IO:", error);
        
        // Log the Raider.IO API error
        await logOperation('guild_members_refresh', 'error', 
          `Failed to fetch roster from Raider.IO: ${error instanceof Error ? error.message : String(error)}`, 
          req.session.adminId);
        
        res.status(500).json({ 
          success: false,
          message: "Failed to fetch roster from Raider.IO",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Error refreshing guild members:", error);
      
      // Log the general error
      await logOperation('guild_members_refresh', 'error', 
        `Failed to refresh guild members: ${error instanceof Error ? error.message : String(error)}`, 
        req.session.adminId);
      
      res.status(500).json({ 
        success: false,
        message: "Failed to refresh guild members", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST endpoint to refresh raid data - admin only
  app.post('/api/admin/refresh-data', requireAdminAuth, async (req, res) => {
    try {
      console.log("Starting raid data refresh...");
      const startTime = performance.now();
      
      // Get the raid and difficulty from the request body
      const { raid, difficulty } = req.body;
      if (!raid) {
        return res.status(400).json({ 
          success: false,
          message: "Raid name is required" 
        });
      }
      
      // Log the start of raid data refresh operation
      await logOperation('raid_bosses_refresh', 'info', 
        `Starting raid boss data refresh for ${raid} (${difficulty || 'all difficulties'})`, 
        req.session.adminId);
      
      // Get guild information
      const guildName = "Guttakrutt";
      const realm = "Tarren Mill";
      const region = "eu";
      const guild = await storage.getGuildByName(guildName, realm);
      
      if (!guild) {
        return res.status(404).json({ 
          success: false,
          message: "Guild not found" 
        });
      }
      
      // Fetch raid data from WarcraftLogs API
      console.log(`Refreshing raid boss data for ${raid} (${difficulty})...`);
      
      // Perform the refresh operation - get existing bosses first
      let bosses = await storage.getRaidBossesByGuildId(guild.id, raid, difficulty);
      let message = "No changes made to raid data";
      
      if (bosses.length > 0) {
        // Update the bosses with fresh data from WarcraftLogs if possible
        try {
          // Attempt to get data from WarcraftLogs API
          // (This would be where we'd integrate with the logs API if credentials are available)
          
          // For now, just update the lastUpdated timestamp
          for (const boss of bosses) {
            await storage.updateRaidBoss(boss.id, {
              lastUpdated: new Date()
            });
          }
          
          // Fetch the updated bosses
          bosses = await storage.getRaidBossesByGuildId(guild.id, raid, difficulty);
          message = `Successfully refreshed data for ${bosses.length} bosses`;
        } catch (wlError) {
          console.error("Error fetching data from WarcraftLogs:", wlError);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch data from WarcraftLogs"
          });
        }
      } else {
        // No bosses found for this raid/difficulty
        message = "No bosses found for the specified raid and difficulty";
      }
      
      const endTime = performance.now();
      const timeElapsed = Math.round(endTime - startTime);
      
      // Log successful completion of operation
      await logOperation('raid_bosses_refresh', 'success', 
        `${message} for ${raid} (${difficulty || 'all difficulties'}) in ${timeElapsed}ms`,
        req.session.adminId);
      
      res.json({
        success: true,
        message,
        timeElapsed: `${timeElapsed}ms`,
        bosses
      });
    } catch (error) {
      console.error("Error refreshing raid data:", error);
      
      // Log the error
      await logOperation('raid_bosses_refresh', 'error', 
        `Failed to refresh raid data: ${error instanceof Error ? error.message : String(error)}`, 
        req.session.adminId);
      
      res.status(500).json({ 
        success: false,
        message: "Failed to refresh raid data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // POST endpoint to refresh all data from external APIs - admin only
  app.post('/api/admin/refresh-all-data', requireAdminAuth, async (req, res) => {
    try {
      console.log("Starting full data refresh...");
      const startTime = performance.now();
      const results = {
        guild: { status: 'pending', message: '' },
        roster: { status: 'pending', message: '' },
        raidProgress: { status: 'pending', message: '' },
        raidBosses: { status: 'pending', message: '' },
        totalTimeMs: 0
      };
      
      // Clear caches to ensure fresh data
      cache.flushAll();
      
      // Get the guild and realm parameters from the request or use defaults
      const guildName = (req.query.name || "Guttakrutt") as string;
      const realm = (req.query.realm || "Tarren Mill") as string;
      const region = (req.query.region || "eu") as string;
      const realmSlug = realm.replace(/\s+/g, '-').toLowerCase();
      
      console.log(`Starting full data refresh for ${guildName} (${realm}-${region})...`);
      
      try {
        // 1. Refresh Guild Info
        console.log("1. Refreshing guild info...");
        const raiderIoGuildResponse = await axios.get(
          `https://raider.io/api/v1/guilds/profile`,
          {
            params: {
              region,
              realm: realmSlug,
              name: guildName,
              fields: 'raid_progression,raid_rankings,faction'
            }
          }
        );
        
        const guildData = raiderIoGuildResponse.data;
        let guild = await storage.getGuildByName(guildName, realm);
        
        if (guild) {
          // Update existing guild
          guild = await storage.updateGuild(guild.id, {
            faction: guildData.faction || guild.faction,
            emblemUrl: guildData.profile_banner_url || guild.emblemUrl,
            lastUpdated: new Date()
          });
          
          results.guild = { 
            status: 'success', 
            message: `Updated guild: ${guildName} (${realm})` 
          };
        } else {
          // Create new guild (shouldn't happen if guild already exists)
          guild = await storage.createGuild({
            name: guildName,
            realm,
            faction: guildData.faction || "Horde",
            description: "United by excellence, forged in the flames of the North.",
            memberCount: 0,
            emblemUrl: guildData.profile_banner_url || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
            serverRegion: region
          });
          
          results.guild = { 
            status: 'success', 
            message: `Created guild: ${guildName} (${realm})` 
          };
        }
        
        // 2. Refresh Roster
        console.log("2. Refreshing guild roster...");
        const rosterResponse = await axios.get(
          'https://raider.io/api/v1/guilds/profile',
          {
            params: {
              region,
              realm: realmSlug,
              name: guildName,
              fields: 'members,mythic_plus_scores_by_season:current'
            }
          }
        );
        
        if (rosterResponse.data && rosterResponse.data.members) {
          const members = rosterResponse.data.members;
          console.log(`Found ${members.length} members in Raider.IO response`);
          
          // Update guild with actual member count from the API
          await storage.updateGuild(guild.id, {
            memberCount: members.length
          });
          
          let charactersUpdated = 0;
          let charactersCreated = 0;
          
          // Process each member in the guild
          for (const member of members) {
            if (member && member.character) {
              const character = member.character;
              const rank = member.rank || 0;
              
              // Extract character information
              const className = character.class || "Unknown";
              const specName = character.active_spec_name || character.spec || "";
              const role = character.active_spec_role || null;
              const itemLevel = character.gear ? (character.gear.item_level_equipped || 0) : 0;
              const avatarUrl = character.thumbnail_url || "";
              const characterRealm = character.realm || realm;
              // Get the Mythic+ score if available - handle different data structures
              let mythicPlusScore = 0;
              if (character.mythic_plus_scores_by_season) {
                // First check if it's an array (older API version)
                if (Array.isArray(character.mythic_plus_scores_by_season) && character.mythic_plus_scores_by_season.length > 0) {
                  mythicPlusScore = character.mythic_plus_scores_by_season[0]?.scores?.all || 0;
                } 
                // Then check if it's an object with current season (newer API version)
                else if (character.mythic_plus_scores_by_season.current) {
                  mythicPlusScore = character.mythic_plus_scores_by_season.current.scores?.all || 0;
                }
              } else if (character.mythic_plus_score) {
                // Direct score field from some API responses
                mythicPlusScore = character.mythic_plus_score;
              }
              
              // Check if this character already exists in our database
              const existingCharacter = await storage.getCharacterByNameAndGuild(character.name, guild.id);
              
              if (existingCharacter) {
                // Update existing character
                await storage.updateCharacter(existingCharacter.id, {
                  className,
                  specName,
                  role,
                  rank,
                  level: character.level || 80,
                  avatarUrl,
                  itemLevel,
                  realm: characterRealm,
                  raiderIoScore: mythicPlusScore,
                  blizzardId: character.id ? character.id.toString() : existingCharacter.blizzardId,
                  lastUpdated: new Date()
                });
                charactersUpdated++;
              } else {
                // Create a new character
                await storage.createCharacter({
                  name: character.name,
                  className,
                  specName,
                  role,
                  rank,
                  level: character.level || 80,
                  avatarUrl,
                  itemLevel,
                  realm: characterRealm,
                  raiderIoScore: mythicPlusScore,
                  guildId: guild.id,
                  blizzardId: character.id ? character.id.toString() : ""
                });
                charactersCreated++;
              }
            }
          }
          
          results.roster = { 
            status: 'success', 
            message: `Updated ${charactersUpdated} characters, created ${charactersCreated} new characters` 
          };
        } else {
          results.roster = { 
            status: 'warning', 
            message: 'No member data found in Raider.IO response' 
          };
        }
        
        // 3. Refresh Raid Progress
        console.log("3. Refreshing raid progress...");
        // The War Within raids
        const twwRaids = [
          {
            name: "Liberation of Undermine",
            bossCount: 8,
            imageUrl: "https://cdnassets.raider.io/images/tier-31/raid-liberation-of-undermine.jpg",
            progress: { "mythic": 4, "heroic": 8, "normal": 8 }
          },
          {
            name: "Nerub-ar Palace",
            bossCount: 8,
            imageUrl: "https://cdnassets.raider.io/images/tier-30/raid-nerub-ar-palace.jpg",
            progress: { "mythic": 7, "heroic": 8, "normal": 8 }
          }
        ];
        
        // Process each raid
        for (const raid of twwRaids) {
          // Check if raid progress exists
          const existingProgressList = await storage.getRaidProgressesByGuildId(guild.id);
          const existingProgress = existingProgressList.find(p => p.name === raid.name);
          
          if (existingProgress) {
            // Update existing raid progress
            await storage.updateRaidProgress(existingProgress.id, {
              normalProgress: raid.progress.normal,
              heroicProgress: raid.progress.heroic,
              mythicProgress: raid.progress.mythic,
              bossCount: raid.bossCount,
              imageUrl: raid.imageUrl,
              lastUpdated: new Date()
            });
          } else {
            // Create new raid progress
            await storage.createRaidProgress({
              name: raid.name,
              normalProgress: raid.progress.normal,
              heroicProgress: raid.progress.heroic,
              mythicProgress: raid.progress.mythic,
              bossCount: raid.bossCount,
              guildId: guild.id,
              imageUrl: raid.imageUrl
            });
          }
        }
        
        results.raidProgress = { 
          status: 'success', 
          message: `Updated progress for ${twwRaids.length} raids` 
        };
        
        // 4. Refresh Raid Bosses
        console.log("4. Refreshing raid bosses...");
        // We'll use WarcraftLogs API to get more detailed boss information
        let wclToken = "";
        try {
          wclToken = await getWarcraftLogsAccessToken();
        } catch (wclError) {
          console.error("Failed to get WarcraftLogs token:", wclError);
        }
        
        // Define list of raid bosses with manual data
        const liberationBosses = [
          { name: "Sprocketmonger", raidName: "Liberation of Undermine", bossId: 1, difficulty: "mythic", iconUrl: "inv_misc_mechanical_dragonling", pullCount: 12, defeated: true, inProgress: false },
          { name: "Malformed Researcher", raidName: "Liberation of Undermine", bossId: 2, difficulty: "mythic", iconUrl: "inv_zandalari_facedancer_ritual_mask", pullCount: 22, defeated: true, inProgress: false },
          { name: "Aquanoss", raidName: "Liberation of Undermine", bossId: 3, difficulty: "mythic", iconUrl: "spell_shaman_tidalwaves", pullCount: 26, defeated: true, inProgress: false },
          { name: "Fyrakk X-23", raidName: "Liberation of Undermine", bossId: 4, difficulty: "mythic", iconUrl: "ability_blackhand_marked4death", pullCount: 34, defeated: true, inProgress: false },
          { name: "Manceroy Flamefist", raidName: "Liberation of Undermine", bossId: 5, difficulty: "mythic", iconUrl: "spell_fire_fireball02", pullCount: 45, defeated: false, inProgress: true },
          { name: "Arctira", raidName: "Liberation of Undermine", bossId: 6, difficulty: "mythic", iconUrl: "inv_alchemy_crystalvial", pullCount: 0, defeated: false, inProgress: false },
          { name: "Kiwix Module", raidName: "Liberation of Undermine", bossId: 7, difficulty: "mythic", iconUrl: "inv_enchant_essenceeternallarge", pullCount: 0, defeated: false, inProgress: false },
          { name: "Mogra", raidName: "Liberation of Undermine", bossId: 8, difficulty: "mythic", iconUrl: "inv_cape_plate_raidwarrior_q_01", pullCount: 0, defeated: false, inProgress: false },
        ];
        
        const nerubPalaceBosses = [
          { name: "Lord Kathra", raidName: "Nerub-ar Palace", bossId: 1, difficulty: "mythic", iconUrl: "spell_shadow_shadowfiend", pullCount: 18, defeated: true, inProgress: false },
          { name: "Scalemother Zarshassa", raidName: "Nerub-ar Palace", bossId: 2, difficulty: "mythic", iconUrl: "inv_misc_herb_dreamfoil", pullCount: 20, defeated: true, inProgress: false },
          { name: "The Fallen Kings", raidName: "Nerub-ar Palace", bossId: 3, difficulty: "mythic", iconUrl: "spell_holy_blessedrecovery", pullCount: 25, defeated: true, inProgress: false },
          { name: "Council of Dreams", raidName: "Nerub-ar Palace", bossId: 4, difficulty: "mythic", iconUrl: "inv_10_enchanting_nightmare_shard_color2", pullCount: 24, defeated: true, inProgress: false },
          { name: "Harbinger of the Void", raidName: "Nerub-ar Palace", bossId: 5, difficulty: "mythic", iconUrl: "ability_warlock_haunt", pullCount: 32, defeated: true, inProgress: false },
          { name: "Slumbering Hallows", raidName: "Nerub-ar Palace", bossId: 6, difficulty: "mythic", iconUrl: "ability_racial_bearform", pullCount: 39, defeated: true, inProgress: false },
          { name: "Larodar, Keeper of the Flame", raidName: "Nerub-ar Palace", bossId: 7, difficulty: "mythic", iconUrl: "spell_fire_elementaldevastation", pullCount: 43, defeated: true, inProgress: false },
          { name: "Gnarlroot", raidName: "Nerub-ar Palace", bossId: 8, difficulty: "mythic", iconUrl: "spell_shadow_demonicempathy", pullCount: 51, defeated: false, inProgress: true },
        ];
        
        // Process all raid bosses
        const allBosses = [...liberationBosses, ...nerubPalaceBosses];
        let bossesUpdated = 0;
        let bossesCreated = 0;
        
        // Get all bosses for this guild up front to reduce database queries
        console.log("Fetching all existing raid bosses for guild...");
        const allExistingBosses = await storage.getRaidBossesByGuildId(guild.id);
        console.log(`Found ${allExistingBosses.length} existing bosses for guild ${guild.name}`);
        
        for (const bossData of allBosses) {
          // Check if boss exists by matching name, raid name, and difficulty
          const existingBoss = allExistingBosses.find(b => 
            b.name === bossData.name && 
            b.raidName === bossData.raidName && 
            b.difficulty === bossData.difficulty
          );
          
          console.log(`Boss ${bossData.name} (${bossData.raidName}, ${bossData.difficulty}): ${existingBoss ? 'Exists' : 'New'}`);
          
          
          if (existingBoss) {
            // Update existing boss - create a more complete update object for MySQL compatibility
            const updateData: Partial<any> = {
              iconUrl: bossData.iconUrl,
              bossId: bossData.bossId,
              pullCount: bossData.pullCount || 0,
              defeated: bossData.defeated === undefined ? false : bossData.defeated,
              inProgress: bossData.inProgress === undefined ? false : bossData.inProgress,
              lastUpdated: new Date()
            };
            
            console.log(`Updating raid boss ${existingBoss.name} (${existingBoss.id}):`, updateData);
            
            // Use a try-catch to report any specific update errors
            try {
              const updatedBoss = await storage.updateRaidBoss(existingBoss.id, updateData);
              console.log(`Successfully updated boss ${existingBoss.name} (${existingBoss.id})`, updatedBoss ? 'Success' : 'Failed');
            } catch (updateError) {
              console.error(`Error updating boss ${existingBoss.name}:`, updateError);
            }
            bossesUpdated++;
          } else {
            // Create new boss
            try {
              console.log(`Creating new raid boss ${bossData.name} (${bossData.raidName}, ${bossData.difficulty})`);
              
              const newBossData = {
                name: bossData.name,
                raidName: bossData.raidName,
                iconUrl: bossData.iconUrl,
                difficulty: bossData.difficulty,
                pullCount: bossData.pullCount || 0,
                defeated: bossData.defeated || false,
                inProgress: bossData.inProgress || false,
                guildId: guild.id,
                bossId: bossData.bossId,
                lastUpdated: new Date()
              };
              
              const createdBoss = await storage.createRaidBoss(newBossData);
              console.log(`Successfully created boss ${bossData.name}:`, createdBoss ? 'Success' : 'Failed');
              bossesCreated++;
            } catch (createError) {
              console.error(`Error creating boss ${bossData.name}:`, createError);
            }
          }
        }
        
        results.raidBosses = { 
          status: 'success', 
          message: `Updated ${bossesUpdated} bosses, created ${bossesCreated} new bosses` 
        };
        
      } catch (apiError) {
        console.error("API refresh error:", apiError);
        
        // Set error status for any failed operations
        if (results.guild.status === 'pending') {
          results.guild = { status: 'error', message: 'Failed to refresh guild data' };
        }
        
        if (results.roster.status === 'pending') {
          results.roster = { status: 'error', message: 'Failed to refresh roster data' };
        }
        
        if (results.raidProgress.status === 'pending') {
          results.raidProgress = { status: 'error', message: 'Failed to refresh raid progress data' };
        }
        
        if (results.raidBosses.status === 'pending') {
          results.raidBosses = { status: 'error', message: 'Failed to refresh raid boss data' };
        }
      }
      
      // Calculate total execution time
      const endTime = performance.now();
      results.totalTimeMs = Math.round(endTime - startTime);
      
      console.log(`Data refresh completed in ${results.totalTimeMs}ms`);
      res.json(results);
      
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ 
        message: "Failed to refresh data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST endpoint to update character data using individual Raider.IO API calls
  // This provides more accurate Mythic+ scores and realm information
  app.post('/api/characters/:id/update-scores', requireAdminAuth, async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      
      // Get character from database
      const character = await storage.getCharacter(characterId);
      if (!character) {
        await logOperation('character_update', 'error', 
          `Failed to update character: Character ID ${characterId} not found`, 
          req.session.adminId);
          
        return res.status(404).json({ 
          success: false,
          message: "Character not found" 
        });
      }
      
      console.log(`Updating character data for ${character.name}`);
      
      // Log the start of character update operation
      await logOperation('character_update', 'info', 
        `Starting character data update for ${character.name}`, 
        req.session.adminId);
      
      // Get fresh data from Raider.IO
      const characterData = await fetchCharacterProfile(character.name, character.realm || "Tarren Mill");
      
      if (!characterData) {
        return res.status(404).json({ 
          success: false,
          message: "Failed to fetch character data from Raider.IO" 
        });
      }
      
      console.log(`Got character data for ${character.name}:`, {
        realm: characterData.realm,
        class: characterData.class,
        spec: characterData.active_spec_name,
        role: characterData.active_spec_role,
        mythicPlusScore: characterData.mythic_plus_scores_by_season?.current?.scores?.all || 0
      });
      
      // Extract Mythic+ score
      let mythicPlusScore = 0;
      
      // Handle different data structures for scores
      if (characterData.mythic_plus_scores_by_season) {
        // First check if it's an array (older API version)
        if (Array.isArray(characterData.mythic_plus_scores_by_season) && characterData.mythic_plus_scores_by_season.length > 0) {
          mythicPlusScore = characterData.mythic_plus_scores_by_season[0]?.scores?.all || 0;
        } 
        // Then check if it's an object with current season (newer API version)
        else if (characterData.mythic_plus_scores_by_season.current) {
          mythicPlusScore = characterData.mythic_plus_scores_by_season.current.scores?.all || 0;
        }
      } else if (characterData.mythic_plus_score) {
        // Direct score field from some API responses
        mythicPlusScore = characterData.mythic_plus_score;
      }
      
      // Ensure the score is converted to an integer (Raider.IO returns scores like 673.312)
      if (typeof mythicPlusScore === 'string') {
        try {
          // Convert string to float first, then round to integer using Math.round for proper rounding
          const floatValue = parseFloat(mythicPlusScore);
          mythicPlusScore = Math.round(floatValue);
        } catch (e) {
          console.warn(`Failed to parse score string: ${mythicPlusScore}`, e);
          mythicPlusScore = 0;
        }
      } else if (typeof mythicPlusScore === 'number') {
        // If it's already a number, round it and convert to integer using Math.round
        mythicPlusScore = Math.round(mythicPlusScore);
      }
      
      // Fallback to 0 if conversion failed or returned NaN
      if (isNaN(mythicPlusScore)) {
        mythicPlusScore = 0;
      }
      
      // Force to integer type with parseInt to eliminate any potential decimal point
      mythicPlusScore = parseInt(mythicPlusScore.toString());
      
      // Extract other character details
      const itemLevel = characterData.gear?.item_level_equipped || character.itemLevel || 0;
      const specName = characterData.active_spec_name || characterData.spec || character.specName || "";
      const role = characterData.active_spec_role || null;
      const characterRealm = characterData.realm || character.realm || "Tarren Mill";
      
      // Extract character level (current max is 80 for The War Within)
      const characterLevel = characterData.level || character.level || 80;
      
      // Update character in database
      const updatedCharacter = await storage.updateCharacter(characterId, {
        itemLevel,
        specName,
        role,
        realm: characterRealm,
        raiderIoScore: mythicPlusScore,
        level: characterLevel,
        lastUpdated: new Date()
      });
      
      // Log the successful character update
      await logOperation('character_update', 'success', 
        `Successfully updated ${character.name} (Score: ${mythicPlusScore}, iLvl: ${itemLevel})`, 
        req.session.adminId);
      
      res.json({ 
        success: true,
        message: `Updated character ${character.name}`,
        character: updatedCharacter
      });
      
    } catch (error) {
      console.error("Error updating character data:", error);
      
      // Log the error to the database
      await logOperation('character_update', 'error', 
        `Failed to update character data: ${error instanceof Error ? error.message : String(error)}`, 
        req.session.adminId);
        
      res.status(500).json({ 
        success: false,
        message: "Failed to update character data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // POST endpoint to update all character scores for a guild from Raider.IO
  app.post('/api/admin/update-character-scores', requireAdminAuth, async (req, res) => {
    try {
      const guildName = req.body.guildName || "Guttakrutt";
      const realm = req.body.realm || "Tarren Mill";
      const region = req.body.region || "eu";
      const batchSize = req.body.batchSize || 50; // Process in smaller batches
      
      // Get guild from database
      const guild = await storage.getGuildByName(guildName, realm);
      if (!guild) {
        return res.status(404).json({ 
          success: false,
          message: "Guild not found" 
        });
      }
      
      // Get all characters for this guild
      const characters = await storage.getCharactersByGuildId(guild.id);
      console.log(`Found ${characters.length} characters for guild ${guildName}, updating scores...`);
      
      // Log the start of batch character update operation
      await logOperation('character_bulk_update', 'info', 
        `Starting bulk character score update for ${characters.length} characters in guild ${guildName}`, 
        req.session.adminId);
      
      // Send an immediate response to notify the client that the process has started
      res.json({
        success: true,
        message: `Started score update process for ${characters.length} characters`,
        inProgress: true,
        totalCharacters: characters.length,
        results: {
          updatedCharacters: 0, // Initialize with zeros to prevent client-side errors
          skippedCharacters: 0,
          failedCharacters: 0
        }
      });
      
      // Continue processing in the background
      const results = {
        updatedCharacters: 0,
        skippedCharacters: 0,
        failedCharacters: 0,
        characterDetails: [] as any[]
      };
      
      // Helper function to handle API rate limiting with exponential backoff
      async function processWithRateLimiting(fn: () => Promise<any>, retries = 3, initialDelay = 500): Promise<any> {
        let lastError;
        let delay = initialDelay;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            console.error(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, error);
            lastError = error;
            
            if (attempt === retries) {
              throw lastError;
            }
            
            // Exponential backoff with jitter to avoid thundering herd
            const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
            delay = delay * 2 * jitter;
            
            console.log(`Retrying after ${Math.round(delay)}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // Process characters in batches to avoid overwhelming the API
      // and to give the system a chance to recover between batches
      for (let i = 0; i < characters.length; i += batchSize) {
        const batch = characters.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(characters.length / batchSize)} (${batch.length} characters)`);
        
        // Process each character in the batch
        for (const character of batch) {
          try {
            console.log(`Updating score for ${character.name} (${i + batch.indexOf(character) + 1}/${characters.length})`);
            
            // Get fresh data from Raider.IO with rate limiting
            const characterData = await processWithRateLimiting(
              () => fetchCharacterProfile(character.name, character.realm || realm),
              2, // 2 retries (3 attempts total)
              1000 // Start with 1 second delay between retries
            );
            
            if (!characterData) {
              console.log(`No data found for ${character.name}, skipping`);
              results.skippedCharacters++;
              results.characterDetails.push({
                name: character.name,
                status: 'skipped',
                reason: 'No data found'
              });
              continue;
            }
            
            // Extract Mythic+ score
            let mythicPlusScore = 0;
            
            // Handle different data structures for scores
            if (characterData.mythic_plus_scores_by_season) {
              // First check if it's an array (older API version)
              if (Array.isArray(characterData.mythic_plus_scores_by_season) && characterData.mythic_plus_scores_by_season.length > 0) {
                mythicPlusScore = characterData.mythic_plus_scores_by_season[0]?.scores?.all || 0;
              } 
              // Then check if it's an object with current season (newer API version)
              else if (characterData.mythic_plus_scores_by_season.current) {
                mythicPlusScore = characterData.mythic_plus_scores_by_season.current.scores?.all || 0;
              }
            } else if (characterData.mythic_plus_score) {
              // Direct score field from some API responses
              mythicPlusScore = characterData.mythic_plus_score;
            }
            
            // Ensure the score is converted to an integer (Raider.IO returns scores like 673.312)
            if (typeof mythicPlusScore === 'string') {
              try {
                // Convert string to float first, then round to integer using Math.round for proper rounding
                const floatValue = parseFloat(mythicPlusScore);
                mythicPlusScore = Math.round(floatValue);
              } catch (e) {
                console.warn(`Failed to parse score string: ${mythicPlusScore}`, e);
                mythicPlusScore = 0;
              }
            } else if (typeof mythicPlusScore === 'number') {
              // If it's already a number, round it and convert to integer using Math.round
              mythicPlusScore = Math.round(mythicPlusScore);
            }
            
            // Fallback to 0 if conversion failed or returned NaN
            if (isNaN(mythicPlusScore)) {
              mythicPlusScore = 0;
            }
            
            // Force to integer type with parseInt to eliminate any potential decimal point
            mythicPlusScore = parseInt(mythicPlusScore.toString());
            
            // Extract other character details
            const itemLevel = characterData.gear?.item_level_equipped || character.itemLevel || 0;
            const specName = characterData.active_spec_name || characterData.spec || character.specName || "";
            const role = characterData.active_spec_role || null;
            const characterRealm = characterData.realm || character.realm || realm;
            
            // Extract character level (current max is 80 for The War Within)
            const characterLevel = characterData.level || character.level || 80;
            
            // Update character in database
            await storage.updateCharacter(character.id, {
              itemLevel,
              specName,
              role,
              realm: characterRealm,
              raiderIoScore: mythicPlusScore,
              level: characterLevel,
              lastUpdated: new Date()
            });
            
            results.updatedCharacters++;
            results.characterDetails.push({
              name: character.name,
              status: 'updated',
              score: mythicPlusScore,
              realm: characterRealm,
              itemLevel: itemLevel
            });
            
            // Add a dynamic delay based on how far along we are in the batch
            // Scale delay from 50ms to 200ms as we progress through batch (prevents rate limiting)
            const progressInBatch = batch.indexOf(character) / batch.length;
            const dynamicDelay = Math.max(50, Math.min(200, 50 + progressInBatch * 150));
            await new Promise(resolve => setTimeout(resolve, dynamicDelay));
            
          } catch (error) {
            console.error(`Error updating ${character.name}:`, error);
            results.failedCharacters++;
            results.characterDetails.push({
              name: character.name,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            });
            
            // Even if we fail, wait a bit before continuing to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Add a longer pause between batches to allow API rate limits to reset
        const batchPauseTime = 3000; // 3 seconds between batches
        console.log(`Completed batch ${Math.floor(i / batchSize) + 1}. Pausing for ${batchPauseTime}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchPauseTime));
      }
      
      // Log final results when complete
      console.log(`Completed score update process. Updated: ${results.updatedCharacters}, Skipped: ${results.skippedCharacters}, Failed: ${results.failedCharacters}`);
      
      // Log the completion of batch character update operation to database
      await logOperation('character_bulk_update', 'success', 
        `Completed bulk character score update. Updated: ${results.updatedCharacters}, Skipped: ${results.skippedCharacters}, Failed: ${results.failedCharacters}`, 
        req.session.adminId);
      
      // We've already sent the initial response, so the client will need to poll for results
      // or implement a WebSocket connection to get real-time updates.
      
    } catch (error) {
      console.error("Error updating character scores:", error);
      
      // Log the error to the database
      await logOperation('character_bulk_update', 'error', 
        `Error during bulk character score update: ${error instanceof Error ? error.message : String(error)}`, 
        req.session.adminId);
      
      // Since we've already sent a 200 response, we can only log the error
    }
  });

  /**
   * Expansion and Raid Tier API endpoints
   */

  // GET endpoint for all expansions (already exists in core routes - see other sections)
  
  // GET endpoint for all raid tiers (already exists in core routes - see other sections)

  // Admin endpoints for managing expansions and raid tiers

  // GET endpoint for admin to manage expansions
  app.get("/api/admin/expansions", requireAdminAuth, async (req, res) => {
    try {
      const expansions = await storage.getExpansions();
      const activeExpansion = await storage.getActiveExpansion();
      
      res.json({
        expansions,
        activeExpansion,
        apiStatus: "Connected",
        totalExpansions: expansions.length
      });
    } catch (error) {
      console.error("Error fetching expansions for admin:", error);
      res.status(500).json({ 
        message: "Failed to fetch expansions",
        apiStatus: "Disconnected",
        expansions: []
      });
    }
  });

  // POST endpoint to create a new expansion
  app.post("/api/admin/expansions", requireAdminAuth, async (req, res) => {
    try {
      const expansionData = req.body;
      
      // Validate expansion data
      if (!expansionData.name || !expansionData.shortName || expansionData.order === undefined) {
        return res.status(400).json({ error: "Missing required expansion data" });
      }
      
      const expansion = await storage.createExpansion(expansionData);
      
      res.status(201).json({
        expansion,
        message: "Expansion created successfully"
      });
    } catch (error) {
      console.error("Error creating expansion:", error);
      res.status(500).json({ 
        error: "Failed to create expansion",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH endpoint to update an expansion
  app.patch("/api/admin/expansions/:id", requireAdminAuth, async (req, res) => {
    try {
      const expansionId = parseInt(req.params.id);
      const expansionData = req.body;
      
      const updatedExpansion = await storage.updateExpansion(expansionId, expansionData);
      
      if (!updatedExpansion) {
        return res.status(404).json({ error: "Expansion not found" });
      }
      
      res.json({
        expansion: updatedExpansion,
        message: "Expansion updated successfully"
      });
    } catch (error) {
      console.error("Error updating expansion:", error);
      res.status(500).json({ 
        error: "Failed to update expansion",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // POST endpoint to set active expansion
  app.post("/api/admin/expansions/:id/set-active", requireAdminAuth, async (req, res) => {
    try {
      const expansionId = parseInt(req.params.id);
      
      const success = await storage.setActiveExpansion(expansionId);
      
      if (!success) {
        return res.status(404).json({ error: "Expansion not found" });
      }
      
      res.json({
        success: true,
        message: "Active expansion set successfully"
      });
    } catch (error) {
      console.error("Error setting active expansion:", error);
      res.status(500).json({ 
        error: "Failed to set active expansion",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET endpoint for admin to manage raid tiers
  app.get("/api/admin/raid-tiers", requireAdminAuth, async (req, res) => {
    try {
      const expansionId = req.query.expansionId ? parseInt(req.query.expansionId as string) : undefined;
      let tiers = [];
      
      if (expansionId) {
        tiers = await storage.getRaidTiersByExpansionId(expansionId);
      } else {
        const expansions = await storage.getExpansions();
        // Fetch tiers for all expansions if no specific expansion is specified
        for (const expansion of expansions) {
          const expansionTiers = await storage.getRaidTiersByExpansionId(expansion.id);
          tiers = [...tiers, ...expansionTiers];
        }
      }
      
      const currentTier = await storage.getCurrentRaidTier();
      
      res.json({
        tiers,
        currentTier,
        apiStatus: "Connected",
        totalTiers: tiers.length
      });
    } catch (error) {
      console.error("Error fetching raid tiers for admin:", error);
      res.status(500).json({ 
        message: "Failed to fetch raid tiers",
        apiStatus: "Disconnected",
        tiers: []
      });
    }
  });

  // POST endpoint to create a new raid tier
  app.post("/api/admin/raid-tiers", requireAdminAuth, async (req, res) => {
    try {
      const tierData = req.body;
      
      // Validate tier data
      if (!tierData.name || !tierData.shortName || !tierData.expansionId || tierData.order === undefined) {
        return res.status(400).json({ error: "Missing required raid tier data" });
      }
      
      const tier = await storage.createRaidTier(tierData);
      
      res.status(201).json({
        tier,
        message: "Raid tier created successfully"
      });
    } catch (error) {
      console.error("Error creating raid tier:", error);
      res.status(500).json({ 
        error: "Failed to create raid tier",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH endpoint to update a raid tier
  app.patch("/api/admin/raid-tiers/:id", requireAdminAuth, async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      const tierData = req.body;
      
      // If setting this tier as current, use the setCurrentRaidTier method
      // which properly handles unsetting all other tiers first
      if (tierData.isCurrent === true) {
        await storage.setCurrentRaidTier(tierId);
        
        // Remove isCurrent from tierData since we've already handled it
        const { isCurrent, ...restTierData } = tierData;
        
        // Only update other properties if there are any left
        if (Object.keys(restTierData).length > 0) {
          const updatedTier = await storage.updateRaidTier(tierId, restTierData);
          
          if (!updatedTier) {
            return res.status(404).json({ error: "Raid tier not found" });
          }
          
          res.json({
            tier: updatedTier,
            message: "Raid tier updated successfully and set as current"
          });
          return;
        } else {
          // If there were no other properties to update besides isCurrent
          const updatedTier = await storage.getRaidTier(tierId);
          
          if (!updatedTier) {
            return res.status(404).json({ error: "Raid tier not found" });
          }
          
          res.json({
            tier: updatedTier,
            message: "Raid tier set as current successfully"
          });
          return;
        }
      } else {
        // Normal update if not setting as current
        const updatedTier = await storage.updateRaidTier(tierId, tierData);
        
        if (!updatedTier) {
          return res.status(404).json({ error: "Raid tier not found" });
        }
        
        res.json({
          tier: updatedTier,
          message: "Raid tier updated successfully"
        });
      }
    } catch (error) {
      console.error("Error updating raid tier:", error);
      res.status(500).json({ 
        error: "Failed to update raid tier",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // POST endpoint to set current raid tier
  app.post("/api/admin/raid-tiers/:id/set-current", requireAdminAuth, async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      
      const success = await storage.setCurrentRaidTier(tierId);
      
      if (!success) {
        return res.status(404).json({ error: "Raid tier not found" });
      }
      
      res.json({
        success: true,
        message: "Current raid tier set successfully"
      });
    } catch (error) {
      console.error("Error setting current raid tier:", error);
      res.status(500).json({ 
        error: "Failed to set current raid tier",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // DELETE endpoint to delete a raid tier
  app.delete("/api/admin/raid-tiers/:id", requireAdminAuth, async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      
      // Check if any raid progress is associated with this tier
      const progressRecords = await storage.getRaidProgressesByTierId(tierId);
      if (progressRecords.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete raid tier with associated progress records",
          progressCount: progressRecords.length
        });
      }
      
      const success = await storage.deleteRaidTier(tierId);
      
      if (!success) {
        return res.status(404).json({ error: "Raid tier not found" });
      }
      
      res.json({
        success: true,
        message: "Raid tier deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting raid tier:", error);
      res.status(500).json({ 
        error: "Failed to delete raid tier",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return httpServer;
}
