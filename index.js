const express=require('express');
const {ApolloServer}=require('apollo-server-express');
const fs=require('fs');
require('dotenv').config();
const typeDefs=fs.readFileSync("./typeDefs.graphql",'UTF-8');
const resolvers=require('./resolvers');
const {MongoClient} =require('mongodb');


async function start(){
    const app=express();
    const client=await MongoClient.connect(
        process.env.MONGODB_URL,
        {
            useNewUrlParser:true,
            useUnifiedTopology: true
        }
    );
    const db=client.db('instagram');
    const server=new ApolloServer({
        typeDefs,
        resolvers,
        context:({req})=>{
            const githubToken=req.headers.authorization;
            const currentUser=db.collection('user').findOne({githubToken});
            return {db,currentUser};
        }
    });
    server.applyMiddleware({app});
    app.get("/",(req,res)=>{
        res.end("Welcome to Instagram api!");
    });
    app.listen({
        port:4000
    },()=>{
        console.log("server is running on http://localhost:4000"+server.graphqlPath);
    });
}

start().then(()=>{
    console.log("everything is ok!");
}).catch((err)=>{
    console.log(err)
});
