//Variable Dev/Produciton
local_uri = "http://127.0.0.1:5500/index.html"
prod_uri = "https://aalsayad.github.io/spotifynowplaying/"

//Spotify App Consts
const client_id = `a474c8e6511146f0b4b162dc31c55728`;
const client_secret = `0a64c27e140f4fd99a525f67aa2c7967`;


//Auth token Vars
let access_token = null;
let refresh_token = null;
const redirect_uri = prod_uri;


//On page load/Redirect get the code and fetch access token
const onPageLoad = () => {
 console.log("App Started (Page rendered)")
 if (window.location.search.length>0){
  console.log("Handling Redirect")
  const queryString = window.location.search;
  const code = queryString.slice(6)
  fetchAccessToken(code)
  window.history.pushState("","", redirect_uri);
 }
 else if(localStorage.getItem("access_token")!==null || localStorage.getItem("refresh_token")!==null) {
  access_token = localStorage.getItem("access_token");
  refresh_token = localStorage.getItem("refresh_token");
  setInterval(fetchTrackInformation, 1000);
 } else {
  console.log("no refresh/access token | Please re-authenticate with spotify")
  console.log(`access_token: ${access_token} | `, `refresh_token: ${refresh_token}`)
 }
}

//Authentication start to spotify platform
const authToSpotify = () => {
  console.log("Authenticating")
  localStorage.setItem("client_id=", client_id)
  localStorage.setItem("client_secret=", client_secret)

  let url = "https://accounts.spotify.com/authorize";
  url +="?client_id=" + client_id;
  url +="&response_type=code";
  url +="&redirect_uri=" + redirect_uri
  url += "&show_dialog=true";
  url +="&scope=user-read-playback-state user-read-currently-playing" //user-modify-playback-state app-remote-control streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private
  window.location.href = url;
}

//Preparing body to send to spotify using XMLHTTPRequest
const fetchAccessToken = (code) => {
  let body = "grant_type=authorization_code";
  body += "&code=" + code;
  body += "&redirect_uri=" + encodeURI(redirect_uri);
  body += "&client_id=" + client_id;
  body += "&client_secret=" + client_secret;

  callAuthorizationAPI(body)
}

//Getting the Access_Token & Refresh_Token
const callAuthorizationAPI =  (body) =>{
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "https://accounts.spotify.com/api/token", true)
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret))
  xhr.send(body)
  xhr.onreadystatechange =  () =>{
    if(xhr.readyState === 4){
      if(xhr.status == 200){
        let data = JSON.parse(xhr.responseText)
        if (data.access_token != undefined) {
          access_token=data.access_token
          localStorage.setItem("access_token", access_token)
        }
        if(data.refresh_token != undefined){
          refresh_token = data.refresh_token;
          localStorage.setItem("refresh_token", refresh_token)
        }
        onPageLoad();
        setInterval(fetchTrackInformation, 1000);
      } else {
        alert(xhr.responseText)
      }
    }
  }
}

//Fetching currently track information from spotify
const fetchTrackInformation = async () => {
  console.log(" - Fetching Track Information")
  const result = await fetch(
    `https://api.spotify.com/v1/me/player/currently-playing?market=ES`,
    {
      method: `GET`,
      headers: {
        "Authorization" : "Bearer " + access_token
      }
    }
  );

  if (result.status === 200) {
    const data = await result.json();
    const trackDetails = {
      songImage: data.item.album.images[0].url,
      songName: data.item.name,
      artist: data.item.artists[0].name,
      currentDuration: convertMsToTime(data.progress_ms),
      totalDuration: convertMsToTime(data.item.duration_ms),
      progressBar: (data.progress_ms / data.item.duration_ms) * 100,
      isPlaying: data.is_playing
    };

    renderInformation(trackDetails);
  } else if (result.status === 401) {
    console.log(`${result}`)
    localStorage.setItem("access_token", null)
    localStorage.setItem("refresh_token", null)
    onPageLoad();
  }
};

//Convert Song durations from ms to double digits
const padTo2Digits = (num) => {
  return num.toString().padStart(2, "0");
};
const convertMsToTime = (milliseconds) => {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
};

//Render Song information
const renderInformation = (trackDetails) => {
  const divSongImage = document.querySelector(".current-song-img");
  const divSongName = document.querySelector(".current-song-name");
  const divSongArtist = document.querySelector(".current-song-artist");
  const divSongCurrentTime = document.querySelector(".current-song-duration");
  const divSongTotalTime = document.querySelector(".total-song-duration");
  const divSongProgressBar = document.getElementById("yellow-progress");

  divSongImage.src = trackDetails.songImage;
  divSongName.innerText = trackDetails.songName;
  divSongArtist.innerText = trackDetails.artist;
  divSongCurrentTime.innerText = trackDetails.currentDuration;
  divSongTotalTime.innerText = trackDetails.totalDuration;
  divSongProgressBar.style.width = trackDetails.progressBar + "%";
};  

//Dark/Light UI Theme Change
const handleThemeChange = () => {
  let darkModeActive = false;
  const darkModeButton = document.getElementById('theme-btn')
  darkModeButton.addEventListener("click", function(){
    if (!darkModeActive){
      document.body.style.background = "#141419"
      darkModeButton.style.background = "white"
      darkModeActive = true;
    } else {
      document.body.style.background = "transparent"
      darkModeButton.style.background = "transparent"
      darkModeActive = false;
    }

  })
}
handleThemeChange()
