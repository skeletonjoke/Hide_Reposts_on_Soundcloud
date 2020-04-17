

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    console.log('Page uses History API and we heard a pushSate/replaceState.');
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "setupExtension"}, function(response) {});  
        });
        
}, {url: [{urlEquals: "https://soundcloud.com/stream"}]});


// chrome.webNavigation.onCompleted.addListener(function() {
//     alert("on complete!");
    
// }, {url: [{urlMatches : 'https://soundcloud.com/stream'}]});

