# College Football Dynasty — Milestone 2

## Included in this milestone
- School selection and franchise creation.
- $50,000,000 starting recruiting budget and zero-player starting roster.
- Opponent selector automatically excludes the selected school.
- Recruiting board with offense, defense, and special-teams positions.
- College-player and high-school-prospect categories; class years 2024–2027.
- Ability-based demonstration salaries, ratings, search, filters, sorting.
- No positional quotas or roster-size limit.
- Recruit and cut actions with local browser storage.
- Existing Three.js player-follow-camera practice prototype and Socket.IO room foundation retained.
- Supabase schema extension for schools, recruiting pool, and signed recruits.

## Important data and feature status
The bundled `data/recruits.json` is **simulated demonstration data**. Names, ratings, schools, class years, and prices are fictional placeholders and are not verified real athletes or real valuations. Replace/import a properly sourced and licensed roster dataset before presenting it as real player data. Injury flags are informational only and do not filter players from recruiting.

Franchise/recruiting progress currently saves in the same browser using `localStorage`. It is not yet tied to a user account or synchronized between devices. Google/email/Clever sign-in, Supabase-backed save operations, real-time matches, and actual opponent gameplay are not implemented in this milestone. Socket.IO currently provides basic season-code rooms only.

## Run locally
Requires Node.js 20+.
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## GitHub + Render update
1. Extract the project folder.
2. In your existing GitHub repository, upload/replace the project files and add the new `data/` folder and `public/app.js`.
3. Commit the changes to the branch connected to Render.
4. Render should automatically redeploy. If not, open the Render service and choose **Manual Deploy → Deploy latest commit**.
5. Check `https://YOUR-RENDER-SITE/api/health`; version should report `0.2.0`.

## Supabase preparation
Run `supabase/milestone-2.sql` in the Supabase SQL Editor after the original `supabase/schema.sql`. The schema is prepared for future cloud persistence, but this frontend milestone does not yet write franchise data to Supabase. Do not expose a Supabase service-role key in browser code or commit secrets.

## Price model
Demo salary is generated from overall rating plus a deterministic per-player variation. It is an in-game balancing formula, not a real-world NIL valuation or contract amount.
