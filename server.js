const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const schools = JSON.parse(fs.readFileSync(path.join(__dirname, "data/schools.json"), "utf8"));
const recruits = JSON.parse(fs.readFileSync(path.join(__dirname, "data/recruits.json"), "utf8"));

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => res.json({ ok: true, game: "College Football Dynasty", version: "0.2.0" }));
app.get("/api/schools", (_req, res) => res.json(schools));
app.get("/api/recruits", (req, res) => {
  const position = String(req.query.position || "ALL").toUpperCase();
  const unit = String(req.query.unit || "ALL").toLowerCase();
  const search = String(req.query.search || "").toLowerCase().slice(0, 60);
  const min = Number(req.query.minOverall || 0);
  const max = Number(req.query.maxOverall || 99);
  const result = recruits.filter(p =>
    (position === "ALL" || p.position === position) &&
    (unit === "all" || p.unit === unit) &&
    p.overall >= min && p.overall <= max &&
    (!search || `${p.name} ${p.position} ${p.positionName} ${p.prospectType} ${p.classYear}`.toLowerCase().includes(search))
  );
  res.json({ players: result, total: result.length, dataNotice: "The included recruiting pool is simulated demonstration data, not verified real athlete data." });
});

const rooms = new Map();
io.on("connection", socket => {
  socket.emit("server:ready", { socketId: socket.id });
  socket.on("league:join", ({ code, teamName } = {}) => {
    if (typeof code !== "string" || !/^[A-Z0-9-]{4,16}$/i.test(code)) {
      socket.emit("league:error", "Enter a valid season code."); return;
    }
    const normalized = code.toUpperCase();
    socket.join(normalized);
    if (!rooms.has(normalized)) rooms.set(normalized, new Set());
    rooms.get(normalized).add(socket.id);
    socket.data.leagueCode = normalized;
    socket.to(normalized).emit("league:member-joined", { socketId: socket.id, teamName: String(teamName || "Coach").slice(0,32) });
    socket.emit("league:joined", { code: normalized });
  });
  socket.on("disconnect", () => {
    const code = socket.data.leagueCode;
    if (code && rooms.has(code)) {
      rooms.get(code).delete(socket.id);
      socket.to(code).emit("league:member-left", { socketId: socket.id });
      if (rooms.get(code).size === 0) rooms.delete(code);
    }
  });
});
server.listen(PORT, () => console.log(`College Football Dynasty running on ${PORT}`));
