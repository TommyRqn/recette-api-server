const express = require('express')
const app = express()
const axios = require('axios')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const passportJWT = require('passport-jwt')
const secret = 'thisismysecret'
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy
const PORT = process.env.PORT || 5000 // this is very important
const urlEncodedParser = express.urlencoded({ extended: true })
const url = 'https://nodetp-5388.restdb.io/rest/'
const option = { headers: { "x-apikey": "8afc40372757a3afc01a4777a8547dca11c81" } }
const cors = require('cors');

// Initialisation de CORS
app.use(cors());
app.use(express.json())

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret
}

// Initialisation de passport
passport.use(
    new JwtStrategy(jwtOptions, async function(payload, next) {

        const users = await axios.get(url + "myusers", option);

        const user = users.data.find(user => user.mail === payload.email)

        if (user) {
            next(null, user)
        } else {
            next(null, false)
        }
    })
)

app.use(passport.initialize())

app.use(express.json())

// Requête pour se connecter
app.post('/login', async function(req, res) {
    const email = req.body.email
    const password = req.body.password

    const users = await axios.get(url + "myusers", option);

    if (!email || !password) {
        res.status(401).json({ error: 'Email or password was not provided.' })
        return
    }

    // usually this would be a database call:
    const user = users.data.find(user => user.mail === email)

    if (!user || user.pass !== password) {
        res.status(401).json({ error: 'Email / password do not match.' })
        return
    }

    const userJwt = jwt.sign({ email: user.mail, id: user.id }, secret)

    res.status(200).json({ jwt: userJwt })
})

// Requête pour ajouter une recette
app.post('/recipe', passport.authenticate('jwt', { session: false }),
        async function(req, res) {
            req.body.create_date = Date.now()
            req.body.id_user = req.user
            let payload = req.body;
            const response = await axios.post(url + "recipe", payload, option);
            res.send(req.body)
        })
    // Requête pour ajouter un utilisateur
app.post('/user', async function(req, res) {
    let payload = req.body;
    const response = await axios.post(url + "myusers", payload, option);
    console.log(response)
    res.send(req.body)
})

// Requête pour récupérer une recette grace à son ID
app.get('/recipe/:id', async function(req, res) {
        let id = req.params.id
        const response = await axios.get(url + "recipe/" + id, option);
        console.log(response)
        res.send(response.data)
    })
    // Requête pour récupérer toute les 
app.get('/allrecipe', async function(req, res) {
        const response = await axios.get(url + "recipe", option);
        console.log(response)
        res.send(response.data)
    })
    // Requête pour supprimer une recette
app.delete('/recipe/:id', passport.authenticate('jwt', { session: false }),
        async function(req, res) {
            let id = req.params.id
            const response = await axios.delete(url + "recipe/" + id, option);
            res.send(response.data)
        })
    // Requête pour modifier une recette
app.patch('/recipe/:id', passport.authenticate('jwt', { session: false }),
        async function(req, res) {
            let id = req.params.id
            let payload = req.body;
            const users = await axios.get(url + "myusers", option);

            const response = await axios.patch(url + "recipe/" + id, payload, option);
            const recipe_id = response.data.id_user.find(recipe_id => recipe_id.id === req.user.id)
            if (recipe_id) {
                if (recipe_id.id == req.user.id) {
                    res.send(response.data)
                }
            } else {
                res.send("You cannot edit this recipe")
            }
        })
    // Server lsitener
app.listen(PORT, function() {
    console.log('Example app listening on port ' + PORT)
})