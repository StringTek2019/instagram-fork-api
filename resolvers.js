const fetch=require('node-fetch');
require('dotenv').config();


function fetchGithubToken(code){
    return fetch(process.env.GITHUB_AUTH_URL,{
        method:process.env.GITHUB_AUTH_METHOD,
        headers:{
            'Content-Type':'application/json',
            Accept:'application/json'
        },
        body:JSON.stringify({
            code,
            client_id:process.env.GITHUB_CLIENT_ID,
            client_secret:process.env.GITHUB_CLIENT_SECRET
        })
    }).then((res)=>{
        return res.json();
    });
}
function fetchGithubUserInfo(token){
    return fetch(process.env.GITHUB_USER_URL,{
        method:process.env.GITHUB_USER_METHOD,
        headers:{
            'Authorization':'token '+token
        }
    }).then((res)=>{
        return res.json();
    });
}


const resolvers={
    Query:{
        photoCount(parent,args,{db}){
            return db.collection('photos').estimatedDocumentCount();
        },
        userCount(parent,args,{db}){
            return db.collection('users').estimatedDocumentCount();
        },
        me(parent,args,{db,currentUser}){
            return currentUser;
        }
    },
    Mutation:{
        async githubAuth(parent,{code},{db}){
            try{
                let payload={};
                const tokenWrapper=await fetchGithubToken(code);
                console.log(tokenWrapper);
                if(tokenWrapper.error){
                    throw new Error(tokenWrapper.error_description);
                }
                payload.token=tokenWrapper.access_token;
                const userWrapper=await fetchGithubUserInfo(payload.token);
                if(userWrapper.error){
                    throw new Error(userWrapper.error_description);
                }
                const latestUser={
                    githubLogin:userWrapper.login,
                    name:userWrapper.name,
                    avatar:userWrapper.avatar_url,
                    githubToken:payload.token
                };
                const {ops:[user]}=await db.collection('user')
                    .replaceOne({githubLogin:latestUser.githubLogin},latestUser,{upsert:true});
                payload.user=user;
                return payload;
            }catch (err) {
                console.log(err);
            }
        }
    }
};
module.exports=resolvers;
