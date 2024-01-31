const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'moviesData.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT
      *
    FROM
        movie;`
  const moviesArray = await database.all(getMoviesQuery)
  response.send(
    moviesArray.map(eachmovie => ({movieName: eachmovie.movie_name})),
  )
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO 
      movie 
        (director_id, movie_name, lead_actor)
    VALUES ('${directorId}', '${movieName}', '${leadActor}')`
  await database.run(addMovieQuery)
  response.send('Movie Successfully Added')
})

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    			SELECT 
      			  * 
    			FROM 
      			  movie 
    			WHERE 
      			  movie_id = ${movieId};`
  const movie = await database.get(getMovieQuery)
  response.send(convertDbObjectToResponseObject(movie))
})

app.put('/movies/:movieId/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const {movieId} = request.params
  const updateMovieQuery = `
            UPDATE
              movie
            SET
              director_id = ${directorId},
              movie_name = '${movieName}',
              lead_actor = '${leadActor}'
            WHERE
              movie_id = ${movieId};`

  await database.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`
  await database.run(deleteMovieQuery)
  response.send('Movie Removed')
})

const convertCamelCase = eachDirector => {
  return {
    directorId: eachDirector.director_id,
    directorName: eachDirector.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getAllDirector = `
    SELECT *
    FROM director`
  const directorArray = await database.all(getAllDirector)
  response.send(
    directorArray.map(eachDirector => convertCamelCase(eachDirector)),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getAllMoviesByDirector = `
    SELECT movie_name
    FROM movie
    WHERE director_id = ${directorId};`
  const moviesArray = await database.all(getAllMoviesByDirector)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app
