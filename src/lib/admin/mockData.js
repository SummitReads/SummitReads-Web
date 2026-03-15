import { C } from "./constants";

// ─── Team members ──────────────────────────────────────────────────────────
// Replace this with a real Supabase query when ready:
// const { data } = await supabase.from('profiles').select('*').eq('org_id', orgId)
export const INITIAL_TEAM = [
  { id:1, name:"Mara Okonkwo",     email:"mara@acme.co",   role:"Admin",   avatar:"MO", status:"active",  currentBook:"Building Consistent Habits",    bookDay:5, bookTotal:7, aiSessToday:4, aiSessWeek:18, lastActive:"2m ago",    streak:12, completedBooks:3, completionRate:89, track:"Leadership"  },
  { id:2, name:"James Whitfield",  email:"james@acme.co",  role:"Manager", avatar:"JW", status:"active",  currentBook:"Deep Focus at Work",             bookDay:2, bookTotal:7, aiSessToday:1, aiSessWeek:7,  lastActive:"1h ago",    streak:5,  completedBooks:2, completionRate:71, track:"New Manager" },
  { id:3, name:"Priya Sharma",     email:"priya@acme.co",  role:"Member",  avatar:"PS", status:"active",  currentBook:"Designing Your Productive Week", bookDay:7, bookTotal:7, aiSessToday:6, aiSessWeek:31, lastActive:"5m ago",    streak:21, completedBooks:5, completionRate:95, track:"Sales"       },
  { id:4, name:"Carlos Mendez",    email:"carlos@acme.co", role:"Member",  avatar:"CM", status:"pending", currentBook:"—",                              bookDay:0, bookTotal:7, aiSessToday:0, aiSessWeek:0,  lastActive:"Invited",   streak:0,  completedBooks:0, completionRate:0,  track:"—"           },
  { id:5, name:"Yuki Tanaka",      email:"yuki@acme.co",   role:"Member",  avatar:"YT", status:"active",  currentBook:"Decision-Making Under Pressure", bookDay:3, bookTotal:7, aiSessToday:2, aiSessWeek:11, lastActive:"3h ago",    streak:8,  completedBooks:1, completionRate:60, track:"Sales"       },
  { id:6, name:"Fatima Al-Hassan", email:"fatima@acme.co", role:"Viewer",  avatar:"FA", status:"active",  currentBook:"Building High-Performance Teams", bookDay:1, bookTotal:7, aiSessToday:0, aiSessWeek:3,  lastActive:"Yesterday", streak:2,  completedBooks:0, completionRate:14, track:"Leadership"  },
];

// ─── Learning tracks ───────────────────────────────────────────────────────
// Replace with: await supabase.from('tracks').select('*, track_books(*)').eq('org_id', orgId)
export const TRACKS = [
  { id:1, name:"Leadership",  books:["Leading Without Authority","Building Consistent Habits","Building High-Performance Teams","Trust & Team Dynamics"], color:C.teal,    members:2, avgProgress:52 },
  { id:2, name:"New Manager", books:["The First 90 Days as a Manager","Radical Feedback","Building High-Performance Teams"],                             color:"#818cf8", members:1, avgProgress:29 },
  { id:3, name:"Sales",       books:["Negotiation That Closes Deals","The Psychology of Persuasion","Scaling Revenue","Designing Your Productive Week"], color:"#34d399", members:2, avgProgress:76 },
];

// ─── 30-day engagement chart data ─────────────────────────────────────────
// Replace with: await supabase.from('ai_sessions').select('created_at').gte('created_at', thirtyDaysAgo)
export const CHART_DATA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    label:       d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    sessions:    Math.round(12 + Math.sin(i * 0.4) * 6 + Math.random() * 8),
    activeUsers: Math.round(3 + Math.random() * 2.5),
    completions: i > 20 ? Math.round(Math.random() * 3) : Math.round(Math.random() * 1.5),
  };
});

// ─── Activity feed ─────────────────────────────────────────────────────────
// Replace with: await supabase.from('activity_feed').select('*').eq('org_id', orgId).limit(20)
export const FEED = [
  { id:1, avatar:"PS", name:"Priya Sharma",    verb:"completed",     detail:"Designing Your Productive Week",        time:"8m ago",    type:"completion" },
  { id:2, avatar:"MO", name:"Mara Okonkwo",    verb:"used AI Coach", detail:"4 sessions · Building Consistent Habits", time:"14m ago", type:"ai"         },
  { id:3, avatar:"YT", name:"Yuki Tanaka",     verb:"started",       detail:"Decision-Making Under Pressure",        time:"1h ago",    type:"start"      },
  { id:4, avatar:"JW", name:"James Whitfield", verb:"reached",       detail:"Stage 2 of Deep Focus at Work",         time:"2h ago",    type:"progress"   },
  { id:5, avatar:"FA", name:"Fatima",          verb:"logged in",     detail:"first session this week",               time:"Yesterday", type:"login"      },
  { id:6, avatar:"PS", name:"Priya Sharma",    verb:"used AI Coach", detail:"6 sessions today",                      time:"Yesterday", type:"ai"         },
];
