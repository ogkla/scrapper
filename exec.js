"use strict";
/* jshint node: true, strict: true, esversion: 6 */
const jsdom = require("jsdom");
const _ = require("lodash");
const util = require("util");
const fs = require("fs");
var config = new WeakMap();


var functionsFactory = {};



class Scrapper {
    constructor(p_config) {
        this.urls = [];
        this.output = "";
        this.outputCount = 0;
        this.fetchListOver = false;
        this.writeMethod = 'writeFile';
        //this.writeMethod = 'appendFile';
        this.totalfetchedCount = 0;
        config.set(this, p_config);
    }

    execute() {
        this._fetchUrlList();
        this._fetchDetailedPage();
    }

    _writeToFile (str) {
        
        if (this.outputCount > 0) {
            this.output += "\n";
        }
        this.output += str;
        this.outputCount++;
        if(this.outputCount >= config.get(this).output.bufferLength) {
            this.dumpIntoFile();
            if (this.writeMethod === 'writeFile') {
                this.writeMethod = 'appendFile';
            }
            this.output = "";
            this.outputCount = 0;
        }
    }

    _extractData (url, window) {
        var str = "";
        var conf = config.get(this);
    
        for (var i = 0; i < conf.detailed.scrapValues.length; i++ ) {
            str += str.length > 0 ? "," : "";
            var value = "";
            var dom = window.document.querySelector(conf.detailed.scrapValues[i].selector);
            if (dom) {
                if (conf.detailed.scrapValues[i].fetchAttribute) {
                    value = dom.value;
                } else {
                    value = dom.textContent;
                }
            }
    
            if (value && conf.detailed.scrapValues[i].split) {
                value = value.split(conf.detailed.scrapValues[i].split.sep)[conf.detailed.scrapValues[i].split.idx];
            }
            if (value) {
                value = value.trim().replace(/"/g, '\\"');
            } else {
                value = "";
            }
    
            if (conf.detailed.scrapValues[i].func) {
                if (!functionsFactory[conf.detailed.scrapValues[i].key]) {
                    /*jshint evil:true */
                    functionsFactory[conf.detailed.scrapValues[i].key] = Function(conf.detailed.scrapValues[i].func);
                }
                value = functionsFactory[conf.detailed.scrapValues[i].key](value);
            }
            str += '"' + value + '"';
        }
        this._writeToFile(str);
    }

    dumpIntoFile () {
        var self = this;
        fs[this.writeMethod](config.get(this).output.location, this.output, (err) => {
            if (err) {
                console.log(err);
                console.log(self.totalfetchedCount);
                process.exit();
            }
        });
    }


    _fetchDetailedPage () {
        if (this.fetchListOver === true && this.urls.length === 0) {
            this.dumpIntoFile();
            return;
        }
        var url, conf;
        conf = config.get(this);
        if (this.urls.length > 0) {
            url = this.urls.shift();
            var jsdomOptions = {};
            jsdomOptions.url = url;
            if(conf.browserDetails.userAgent) {
                jsdomOptions.userAgent = conf.browserDetails.userAgent;
            }
            if(conf.browserDetails.headers) {
                jsdomOptions.headers = {};
                if (conf.browserDetails.headers.cookie) {
                    jsdomOptions.headers.Cookie = conf.browserDetails.headers.cookie;
                }
            }
            jsdomOptions.done = function (err, window) {
                if (err) {
                    console.log(err);
                    console.log("total fetch count:-" + this.totalfetchedCount);
                    process.exit();
                }
    
                this._extractData(url, window);
                this.totalfetchedCount++;
                console.log("Total Fetched Count:-" + this.totalfetchedCount);    
                setTimeout(_.bind(this._fetchDetailedPage, this), conf.throttleTime);
            }.bind(this);
            
            jsdom.env(jsdomOptions);
        } else {
            setTimeout(_.bind(this._fetchDetailedPage, this), conf.throttleTime);
        }
    }


    _fetchUrlList (page) {
        var conf, self = this;
        conf = config.get(this);
        if (page > conf.list.pageLimit) {
            this.fetchListOver = true;
            return;
        }
        function collectList (window){
            var allLinkDom = window.document.querySelectorAll(conf.list.selectorForLink);
            if (allLinkDom.length === 0) {
                console.log("time to feed cookie ??");
                process.exit();
            }
            for (var i = 0; i < allLinkDom.length; i++) {
                self.urls.push(allLinkDom[i].getAttribute('href'));
            }
        }
    
    
        page = page || conf.list.startIndex;
        var listUrl = conf.list.url.replace('%page%', page);
        var jsdomOptions = {};
        jsdomOptions.url = listUrl;
        if (conf.browserDetails.userAgent) {
            jsdomOptions.userAgent = conf.browserDetails.userAgent;
        }
        if (conf.browserDetails.headers) {
            jsdomOptions.headers = {};
            if (conf.browserDetails.headers.cookie) {
                jsdomOptions.headers.Cookie = conf.browserDetails.headers.cookie;
            }
        }

        jsdomOptions.done = function (err, window) {
            if (err) {
                console.log(err);
                console.log("total fetch count:-" + self.totalfetchedCount);
                process.exit();
            }
            collectList(window);
            setTimeout(_.bind(this._fetchUrlList, this, page + 1), conf.listPageThrottleTime || conf.throttleTime );
        }.bind(this);
        jsdom.env(jsdomOptions);
    }
}
module.exports = Scrapper;