var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
if (!('webkitSpeechRecognition' in window)) {
  upgrade();
} else {
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  console.log(recognition);

  recognition.onstart = function() {
    recognizing = true;
  };

  recognition.onaudiostart = function() {
    showInfo("Audio started!!");
  }

  recognition.onsoundstart = function() {
    showInfo("Sound started!!");
  }

  recognition.onspeechstart = function() {
    showInfo("Speech started!");
  }

  recognition.onnomatch = function() {
    showInfo("No match!");
  }

  recognition.onspeechend = function() {
    showInfo("Speech ended!");
  }

  recognition.onsoundend = function() {
    showInfo("Sound ended!");
  }

  recognition.onaudioend = function() {
    showInfo("Audio ended!!");
    recognition.onstart();
  }

  recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
      showInfo('info_no_speech');
      ignore_onend = false;
      startButton(event);
    }
    if (event.error == 'audio-capture') {
      showInfo('info_no_microphone');
      ignore_onend = false;
    }
    if (event.error == 'not-allowed') {
      if (event.timeStamp - start_timestamp < 100) {
        showInfo('info_blocked');
      } else {
        showInfo('info_denied');
      }
      ignore_onend = false;
    }
  };

  recognition.onend = function() {
    console.log("ended...");
    recognizing = false;
    startButton(event);
    if (ignore_onend) {
      return;
    }
    if (!final_transcript) {
      return;
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
      var range = document.createRange();
      window.getSelection().addRange(range);
    }
  };

  recognition.onresult = function(event) {
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      // console.log("transcript: " + event.results[i][0]);
      if (event.results[i].isFinal) {
        final_transcript = event.results[i][0].transcript;

        // 첫번째가 공백이면 자름
        if (final_transcript.charAt(0) == " ") {
          final_transcript = final_transcript.substring(1, final_transcript.length);
        }

        $('#pac-input').val(final_transcript);
        var e = $.Event( "keypress", { which: 13 } );
        $('#pac-input').trigger(e);


        console.log("final_transcript: '" + final_transcript + "'");

        // 문자 인식 부분
        if (final_transcript == "bye bye" || interim_transcript == " bye bye") {
          startButton(event);
        } else if (final_transcript == "잘가" || final_transcript == " 잘가") {
          startButton(event);
        }

      } else {
        interim_transcript += event.results[i][0].transcript;
        console.log("interim_transcript: '" + interim_transcript + "'");
        if (interim_transcript == " bye bye") {
          startButton(event);
        }

      }
    }
    final_transcript = capitalize(final_transcript);
  };
}

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

function startButton(event) {
  console.log("button: " + event);
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  // recognition.lang = 'en-US';
  recognition.lang = 'ko-KR';

  console.log(recognition.lang);
  recognition.start();
  ignore_onend = false;
  start_timestamp = event.timeStamp;
}

function showInfo(info) {
  console.log(info);
}
