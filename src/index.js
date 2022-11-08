
const client_id = `a474c8e6511146f0b4b162dc31c55728`;
const client_secret = `0a64c27e140f4fd99a525f67aa2c7967`;
const redirect_uri = `http://127.0.0.1:5500/index.html`;
let access_token = null;
let refresh_token = null;

//First Authenticate with Spotify to get code
const authToSpotify = () => {
  console.log("Authenticating")
  localStorage.setItem("client_id=", client_id)
  localStorage.setItem("client_secret=", client_secret)

  let url = "https://accounts.spotify.com/authorize";
  url +="?client_id=" + client_id;
  url +="&response_type=code";
  url +="&redirect_uri=" + redirect_uri
  url += "&show_dialog=true";
  url +="&scope=user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private"
  window.location.href = url;
}

//On page load/Redirect get the code and fetch access token
const onPageLoad = () => {
 console.log("pageLoaded")
 if (window.location.search.length>0){
  const queryString = window.location.search;
  const code = queryString.slice(6)
  fetchAccessToken(code)
  window.history.pushState("","", redirect_uri);
 }
}

const fetchAccessToken = (code) => {
  let body = "grant_type=authorization_code";
  body += "&code=" + code;
  body += "&redirect_uri=" + encodeURI(redirect_uri);
  body += "&client_id=" + client_id;
  body += "&client_secret=" + client_secret;

  callAuthorizationAPI(body)
}

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
        console.log(data)
        if (data.access_token != undefined) {
          access_token=data.access_token
          localStorage.setItem("access_token", access_token)
          // console.log(access_token)
        }
        if(data.refresh_token != undefined){
          refresh_token = data.refresh_token;
          localStorage.setItem("refresh_token", refresh_token)
        }
        onPageLoad();
        setInterval(fetchTrackInformation, 1000);
      } else {
        // console.log(xhr.responseText)
        alert(xhr.responseText)
      }
    }
  }
}


const fetchTrackInformation = async () => {
  console.log("fetching track")
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
      progressBar: (data.progress_ms / data.item.duration_ms) * 100
    };

    renderInformation(trackDetails);
  } else {
    console.log(result);
  }
};

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

// fetchTrackInformation();
// setInterval(fetchSpotify, 5000);