let app = new Vue({
  el: "#app",
  data: {
    status: "",
    code: ""
  }
});

function startCam() {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(gotMedia).catch(console.error)
}

function gotMedia (stream) {
  let peer = new SimplePeer({ initiator: true, stream: stream });
  let firstSignal = true;
  
  peer.on('error', console.error);

  peer.on('signal', data => {
    if (firstSignal) {
      firstSignal = false;
      let ref = firebase.database().ref('/').push();
      ref.set({
        origin: JSON.stringify(data)
      }).then(() => {
        app.code = ref.key;
        app.status = "cam";
        firebase.database().ref(ref.key + '/return').on('value', (snap) => {
          if (snap.val()) peer.signal(snap.val());
        });
      });
    }
  });

  peer.on('connect', () => {
    console.log("CONNECTED");
  });
}

function startDash(code) {
  firebase.database().ref(code).once('value', (snap) => {
    app.status = "dash";
    app.code = code;
    console.log(snap.val());

    let peer = new SimplePeer();
  
    if (snap.val()?.origin) peer.signal(snap.val().origin)

    peer.on('signal', data => {
      firebase.database().ref(code + "/return").set(JSON.stringify(data));
    });
  
    peer.on('stream', stream => {
      var video = document.querySelector('video')
  
      if ('srcObject' in video) {
        video.srcObject = stream
      } else {
        video.src = window.URL.createObjectURL(stream);
      }
  
      video.play();
    });

    peer.on('connect', () => {
      console.log("CONNECTED");
    });
  }).catch((e) => {
    console.error(e);
    alert('Invalid Camera Code.');
  });

}
