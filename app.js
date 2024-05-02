const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()
app.use(express.json())

let db = null

const initilizeDbToRespoanse = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error  ${e.message}`)
    process.exit(1)
  }
}
initilizeDbToRespoanse()

// covert the names snake to camelcase
const convertDbToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
  }
}

// API 1 GET Returns a list of all the players in the player table

app.get('/players/', async (request, response) => {
  const playerQuery = `SELECT * FROM player_details;`
  const listPlayer = await db.all(playerQuery)
  response.send(
    listPlayer.map(eachplayer => convertDbToResponseObject(eachplayer)),
  )
})

//API 2 GET Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const listPlayer = await db.get(playerQuery)
  response.send(convertDbToResponseObject(listPlayer))
})

// API 3 Updates the details of a specific player based on the player ID

app.put('/players/:playerId/', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const updateQuery = `
  UPDATE player_details SET player_name = "${playerName}" WHERE player_id = ${playerId}`
  await db.run(updateQuery)
  response.send('Player Details Updated')
})

// API 4 GET  Returns the match details of a specific match

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const playerQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`
  const listPlayer = await db.get(playerQuery)
  response.send(convertDbToResponseObject(listPlayer))
})

// API 5 GET Returns a list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const playerQuery = `
  SELECT 
  match_id,match,year
  FROM 
  player_match_score 
  NATURAL JOIN 
  match_details 
  WHERE player_id = ${playerId};`
  const listPlayer = await db.all(playerQuery)
  response.send(
    listPlayer.map(eachplayer => convertDbToResponseObject(eachplayer)),
  )
})

// API 6  GET Returns a list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const playerQuery = `SELECT 
  player_details.player_id,player_details.player_name 
  FROM 
  player_match_score 
  NATURAL JOIN 
  player_details 
  WHERE match_id =${matchId};`
  const listPlayer = await db.all(playerQuery)
  response.send(
    listPlayer.map(eachplayer => convertDbToResponseObject(eachplayer)),
  )
})

// API 7 GET Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const playerQuery = `SELECT 
   player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
   FROM 
   player_match_score 
   NATURAL JOIN
   player_details 
   WHERE 
    player_id = ${playerId};`
  const listPlayer = await db.get(playerQuery)

  response.send(listPlayer)
})
module.exports = app
