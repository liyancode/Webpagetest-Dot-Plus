function getDomainFromUrl(url) {
    var host = "null";
    if (typeof url == "undefined" || null == url)
        url = window.location.href;
    var regex = /.*\:\/\/([^\/]*).*/;
    var match = url.match(regex);
    if (typeof match != "undefined" && null != match)
        host = match[1];
    return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
    /*if(getDomainFromUrl(tab.url).toLowerCase()=="www.webpagetest.org"){
     chrome.pageAction.show(tabId);
     }*/
    chrome.pageAction.show(tabId);
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

var wptRequestData = "";
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        wptRequestData = request;
        console.log(wptRequestData);
    });