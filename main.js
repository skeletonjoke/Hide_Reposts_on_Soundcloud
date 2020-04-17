//this is the content script
console.log("content script loaded !");
//dev debug
var debug = true;
//dev verbose
var verbose = false;
if (debug == false) verbose = false //Verbose is not shown when debug is not shown 

// Soundcloud's const string
const STREAM_URL = "https://soundcloud.com/stream";
const ID_STREAM = "stream";

//// MY const strings
const ID_CHECKBOX = 'hide-reposts';
const ID_NUMBER_OF_REPOST = "number-reposts";
const CLASS_HIDE_ELEMENT = 'hide-repost';

// var
var checkboxElement;
var stream = undefined;
var counter = 0;
var previousCounter = 0;


function onLoad() {
    if(window.location.toString() == STREAM_URL){
        initializeExtension()
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // Look for Exact message
        if ((request.action == "setupExtension") && (window.location.toString() == STREAM_URL)) {
            //we are on the correct page (for sure)
            console.log("message received");

            initializeExtension()

        }
    });

async function initializeExtension(){

    //reset all variables
    stream = undefined;
    counter = 0;
    previousCounter = 0;
    
    var isCheckboxInitialized = (document.getElementById(ID_CHECKBOX) != null);
    while(isCheckboxInitialized != true) {
        isCheckboxInitialized = initializeCheckbox()
        if(isCheckboxInitialized != true){
            //wait some time -> sleep()
            await new Promise(r => setTimeout(r, 200));
        }
    }

    hideShowReposts();
    // when stream is updated -> recheck the song list
    var observerStream = new MutationObserver(function(mutations) {
        hideShowReposts()
      });
        observerStream.observe(stream, { attributes: false, childList: true, subtree: true, characterData: false });

}



function initializeCheckbox() {
    if (debug) console.log("initializeCheckbox()");

    stream = document.getElementsByClassName(ID_STREAM)[0]; // le contenu de l'onglet stream
    // var streamHeader = document.getElementsByClassName("stream__header")[0]; // le haut de l'onglet stream
    var streamList; // la liste les chansons (li) du stream

    //-------------------- add checkbox ----------------

    var checkboxHtml = `
     <div class="checkboxControl sc-type-large">
         <label class="checkbox sc-checkbox">
             <input type="checkbox" id="` + ID_CHECKBOX + `" checked>
             <span class="sc-checkbox-label">Hide the </span>
             <span class="sc-checkbox-label" id="` + ID_NUMBER_OF_REPOST + `" >0</span>
             <span class="sc-checkbox-label"> reposts</span>
         </label>
         <div class="checkboxFormControl__validation g-input-validation g-input-validation-hidden"></div>
     </div>
     `

    var checkboxParsed = new DOMParser().parseFromString(checkboxHtml, 'text/html');
    checkboxParsed = checkboxParsed.firstChild;
    // streamHeader.appendChild(checkboxParsed);
    if (stream != undefined){
        stream.insertAdjacentHTML("afterbegin", checkboxHtml); //add the checkbox to the page
        
        //-------------------- bind checkbox state to hide/show ----------------
        checkboxElement = document.getElementById(ID_CHECKBOX);
        //quand la valeur de checkbox change -> machiné les chansons
        checkboxElement.addEventListener("click", hideShowReposts);

        //is checkbox correctly setup
        return true
    }else{
        //TODO REtry to setup the checkbox later
        console.log("stream not initialized yet")
        //retry to init checkbox
        console.log("retrying")
        return false
    }
}

//this : htmlElement
//ev: event
//return: nothing
function hideShowReposts(a, ev) {
    if (debug) console.log("hideShowReposts");

    streamList = document.getElementsByClassName("soundList__item");
    if (verbose) console.log("streamList.length = " + streamList.length);
    if (checkboxElement.checked) {
        if (verbose) console.log("hiding Reposts");
        for (var i = 0; i < streamList.length; i++) {
            var element = streamLiToElement(streamList[i]);
            if (element != undefined) {// safety check
                var ariaLabel = element.getAttribute('aria-label');
                if (isPlaylist(element, ariaLabel)) {
                    if (verbose) console.log("it's a playlist");
                    if (doWeHideThisPlaylist(element, ariaLabel)) {
                        if (verbose) console.log("HIDING -> " + ariaLabel);
                        // element.parentNode.removeChild(element);
                        if(element.classList.contains(CLASS_HIDE_ELEMENT) == false){
                            element.classList.add(CLASS_HIDE_ELEMENT);
                            counter++
                        }
                    }
                } else {
                    if (verbose) console.log("it's a song");
                    if (doWeHideThisSong(element, ariaLabel)) {
                        if (verbose) console.log("HIDING -> " + ariaLabel);
                        // element.parentNode.removeChild(element);
                        if(element.classList.contains(CLASS_HIDE_ELEMENT) == false){
                            element.classList.add(CLASS_HIDE_ELEMENT);
                            counter++
                        }
                    }
                }
            }
        }
        updateCounter();
    } else {
        if (verbose) console.log("showing Reposts");
        //counter will have to be recalculate when checkbox will be checked again
        counter = 0;
        previousCounter = 0;
        for (var i = 0; i < streamList.length; i++) {
            var element = streamLiToElement(streamList[i]);
            if (element != undefined) { // safety check
                if(element.classList.contains(CLASS_HIDE_ELEMENT) == true){
                    element.classList.remove(CLASS_HIDE_ELEMENT);
                }
            }
        }
    }
}

function updateCounter(){
    if(counter != previousCounter){
        previousCounter = counter;
        document.getElementById(ID_NUMBER_OF_REPOST).innerHTML = counter.toString();
    }
}

//param: element you whant to test, ariaLabel corresponding to the song
//return boolean
function doWeHideThisSong(element, ariaLabel) {
    var songIsRepost = checkRepost(ariaLabel);

    //soundContext__usernameLink
    var artistName = getArtistName(element);
    var songName = element.getElementsByClassName("soundTitle__title")[0].getElementsByTagName('span')[0].innerHTML;//full name like: blur - song 2 (david remix)

    if (verbose) console.log("artistName = " + artistName);
    if (verbose) console.log("songName = " + songName);

    var isOwnSong; // is it a song reposted by an artist who participated to the song ?
    if (songName.toLowerCase().indexOf(artistName.toLowerCase()) != -1) {
        isOwnSong = true;
    } else {
        isOwnSong = false;
    }

    //if it's a repost AND the artist name is not contained in the song title
    if (songIsRepost) {
        if (isOwnSong) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }

}

//param: element you whant to test, ariaLabel corresponding to the playlist
//return boolean
function doWeHideThisPlaylist(element, ariaLabel) {

    var playlistLength = getPlaylistLength(element);
    // console.log("number of tracks" + playlistLength);
    var playlistIsRepost = checkRepost(ariaLabel);

    // if(playlistLength == 1) return true // line of rage
    if (playlistIsRepost) {
        //TODO same check that with the songs -> artist name is contained in song name
        return true
    } else {
        return false;
    }

}

function isPlaylist(element, ariaLabel) {
    if (verbose) console.log("ariaLabel = " + ariaLabel);
    var text = ariaLabel.slice(0, 5);
    if (text == "Titre") {
        return false;
    } else {
        return true;
    }
}

//param: the element should be a playlist  
//return the amount of track un a playlist
function getPlaylistLength(element) {
    var liArray = element.getElementsByClassName("compactTrackList__item");
    return liArray.length;
}

function getArtistName(element) {
    return element.getElementsByClassName("soundContext__usernameLink")[0].innerHTML;
}


//param: a <li> from the stream
//return: the div directly corresponding to the song or playlist
function streamLiToElement(li) {
    return li.getElementsByClassName("sound")[0];
}

//param ariaLabel
//return: boolean -> is it a repost ?
function checkRepost(ariaLabel) {
    // look for "repost" in the aria-label atribute
    // TODO: do it a better way
    if (ariaLabel.indexOf("repost") != -1) {
        return true;
    } else {
        return false;
    }
}




window.onload = onLoad;