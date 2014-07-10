setTimeout(function () {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = "document.body.setAttribute('data-fp', JSON.stringify(wptRequestData));"
    document.head.appendChild(script);
    document.head.removeChild(script);

    var msg = document.body.getAttribute('data-fp');
    console.log(msg);
    chrome.runtime.sendMessage(msg);
    //console.log(wptRequestData);
    //alert(document.body.getAttribute('data-fp'));
}, 1000);