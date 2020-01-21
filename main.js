//dev debug
var debug = false;
//dev verbose
var verbose;
if(debug == false) 
verbose = debug 
else verbose = false;

var stream = document.getElementsByClassName("stream")[0]; // le contenu de l'onglet stream
// var streamHeader = document.getElementsByClassName("stream__header")[0]; // le haut de l'onglet stream
var streamList; // la liste les chansons (li) du stream

//-------------------- checkbox ----------------

var checkboxHtml = `
 <div class="checkboxControl sc-type-large">
     <label class="checkbox sc-checkbox">
         <input type="checkbox" id="hide-reposts" checked>
         <span class="sc-checkbox-label">Hide the </span>
         <span class="sc-checkbox-label" id="number-reposts" >0</span>
         <span class="sc-checkbox-label"> reposts</span>
     </label>
     <div class="checkboxFormControl__validation g-input-validation g-input-validation-hidden"></div>
 </div>
 `

var checkboxParsed = new DOMParser().parseFromString(checkboxHtml, 'text/html');
checkboxParsed = checkboxParsed.firstChild;
// streamHeader.appendChild(checkboxParsed);
stream.insertAdjacentHTML( "afterbegin",checkboxHtml); //add the checkbox to the page

var checkboxElement;

window.onload = onLoad;

function onLoad() {
    main();
    window.onscroll = hideShowReposts;
}

function main() {
    if(debug) console.log("main()");
    //-------------------- stream ----------------

    checkboxElement = document.getElementById('hide-reposts');

    hideShowReposts();

    //quand la valeur de checkbox change -> machiné les chansons
    checkboxElement.addEventListener("click", hideShowReposts);
}

//this : htmlElement
//ev: event
//return: nothing
function hideShowReposts(a, ev) {
    var counter = 0;

    streamList = document.getElementsByClassName("soundList__item");
    if(debug) console.log("streamList.length = " + streamList.length);
    if (checkboxElement.checked) {
        if(debug) console.log("hiding Reposts");
        for (var i = 0; i < streamList.length; i++) {
            var element = streamLiToElement(streamList[i]);
            if (element != undefined) {// safety check
                var ariaLabel = element.getAttribute('aria-label');
                if (isPlaylist(element, ariaLabel)) {
                    if (verbose) console.log("it's a playlist");
                    if (doWeHideThisPlaylist(element, ariaLabel)) {
                        if(debug) console.log("HIDING -> " + ariaLabel);
                        // element.parentNode.removeChild(element);
                        element.classList.add('hide-repost');
                        counter++
                    }
                } else {
                    if (verbose) console.log("it's a song");
                    if (doWeHideThisSong(element, ariaLabel)) {
                        if(debug) console.log("HIDING -> " + ariaLabel);
                        // element.parentNode.removeChild(element);
                        element.classList.add('hide-repost');
                        counter++
                    }
                }
            }
        }
        document.getElementById('number-reposts').innerHTML = counter.toString()
    } else {
        if(debug) console.log("showing Reposts");
        for (var i = 0; i < streamList.length; i++) {
            var element = streamLiToElement(streamList[i]);
            if (element != undefined) {// safety check
                element.classList.remove('hide-repost');
            }
        }
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
    // look for "repostée" in the aria-label atribute
    if (ariaLabel.indexOf("reposté") != -1) {
        return true;
    } else {
        return false;
    }
}