(()=>{var cf=Object.create;var ph=Object.defineProperty;var hf=Object.getOwnPropertyDescriptor;var uf=Object.getOwnPropertyNames;var df=Object.getPrototypeOf,ff=Object.prototype.hasOwnProperty;var pf=(s,e)=>()=>(e||s((e={exports:{}}).exports,e),e.exports);var mf=(s,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of uf(e))!ff.call(s,i)&&i!==t&&ph(s,i,{get:()=>e[i],enumerable:!(n=hf(e,i))||n.enumerable});return s};var gf=(s,e,t)=>(t=s!=null?cf(df(s)):{},mf(e||!s||!s.__esModule?ph(t,"default",{value:s,enumerable:!0}):t,s));var jd=pf(cl=>{(function(){"use strict";var s=function(){this.init()};s.prototype={init:function(){var a=this||e;return a._counter=1e3,a._html5AudioPool=[],a.html5PoolSize=10,a._codecs={},a._howls=[],a._muted=!1,a._volume=1,a._canPlayEvent="canplaythrough",a._navigator=typeof window<"u"&&window.navigator?window.navigator:null,a.masterGain=null,a.noAudio=!1,a.usingWebAudio=!0,a.autoSuspend=!0,a.ctx=null,a.autoUnlock=!0,a._setup(),a},volume:function(a){var c=this||e;if(a=parseFloat(a),c.ctx||u(),typeof a<"u"&&a>=0&&a<=1){if(c._volume=a,c._muted)return c;c.usingWebAudio&&c.masterGain.gain.setValueAtTime(a,e.ctx.currentTime);for(var d=0;d<c._howls.length;d++)if(!c._howls[d]._webAudio)for(var f=c._howls[d]._getSoundIds(),m=0;m<f.length;m++){var x=c._howls[d]._soundById(f[m]);x&&x._node&&(x._node.volume=x._volume*a)}return c}return c._volume},mute:function(a){var c=this||e;c.ctx||u(),c._muted=a,c.usingWebAudio&&c.masterGain.gain.setValueAtTime(a?0:c._volume,e.ctx.currentTime);for(var d=0;d<c._howls.length;d++)if(!c._howls[d]._webAudio)for(var f=c._howls[d]._getSoundIds(),m=0;m<f.length;m++){var x=c._howls[d]._soundById(f[m]);x&&x._node&&(x._node.muted=a?!0:x._muted)}return c},stop:function(){for(var a=this||e,c=0;c<a._howls.length;c++)a._howls[c].stop();return a},unload:function(){for(var a=this||e,c=a._howls.length-1;c>=0;c--)a._howls[c].unload();return a.usingWebAudio&&a.ctx&&typeof a.ctx.close<"u"&&(a.ctx.close(),a.ctx=null,u()),a},codecs:function(a){return(this||e)._codecs[a.replace(/^x-/,"")]},_setup:function(){var a=this||e;if(a.state=a.ctx&&a.ctx.state||"suspended",a._autoSuspend(),!a.usingWebAudio)if(typeof Audio<"u")try{var c=new Audio;typeof c.oncanplaythrough>"u"&&(a._canPlayEvent="canplay")}catch{a.noAudio=!0}else a.noAudio=!0;try{var c=new Audio;c.muted&&(a.noAudio=!0)}catch{}return a.noAudio||a._setupCodecs(),a},_setupCodecs:function(){var a=this||e,c=null;try{c=typeof Audio<"u"?new Audio:null}catch{return a}if(!c||typeof c.canPlayType!="function")return a;var d=c.canPlayType("audio/mpeg;").replace(/^no$/,""),f=a._navigator?a._navigator.userAgent:"",m=f.match(/OPR\/(\d+)/g),x=m&&parseInt(m[0].split("/")[1],10)<33,p=f.indexOf("Safari")!==-1&&f.indexOf("Chrome")===-1,g=f.match(/Version\/(.*?) /),_=p&&g&&parseInt(g[1],10)<15;return a._codecs={mp3:!!(!x&&(d||c.canPlayType("audio/mp3;").replace(/^no$/,""))),mpeg:!!d,opus:!!c.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!c.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!c.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!(c.canPlayType('audio/wav; codecs="1"')||c.canPlayType("audio/wav")).replace(/^no$/,""),aac:!!c.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!c.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(c.canPlayType("audio/x-m4a;")||c.canPlayType("audio/m4a;")||c.canPlayType("audio/aac;")).replace(/^no$/,""),m4b:!!(c.canPlayType("audio/x-m4b;")||c.canPlayType("audio/m4b;")||c.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(c.canPlayType("audio/x-mp4;")||c.canPlayType("audio/mp4;")||c.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!!(!_&&c.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),webm:!!(!_&&c.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),dolby:!!c.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(c.canPlayType("audio/x-flac;")||c.canPlayType("audio/flac;")).replace(/^no$/,"")},a},_unlockAudio:function(){var a=this||e;if(!(a._audioUnlocked||!a.ctx)){a._audioUnlocked=!1,a.autoUnlock=!1,!a._mobileUnloaded&&a.ctx.sampleRate!==44100&&(a._mobileUnloaded=!0,a.unload()),a._scratchBuffer=a.ctx.createBuffer(1,1,22050);var c=function(d){for(;a._html5AudioPool.length<a.html5PoolSize;)try{var f=new Audio;f._unlocked=!0,a._releaseHtml5Audio(f)}catch{a.noAudio=!0;break}for(var m=0;m<a._howls.length;m++)if(!a._howls[m]._webAudio)for(var x=a._howls[m]._getSoundIds(),p=0;p<x.length;p++){var g=a._howls[m]._soundById(x[p]);g&&g._node&&!g._node._unlocked&&(g._node._unlocked=!0,g._node.load())}a._autoResume();var _=a.ctx.createBufferSource();_.buffer=a._scratchBuffer,_.connect(a.ctx.destination),typeof _.start>"u"?_.noteOn(0):_.start(0),typeof a.ctx.resume=="function"&&a.ctx.resume(),_.onended=function(){_.disconnect(0),a._audioUnlocked=!0,document.removeEventListener("touchstart",c,!0),document.removeEventListener("touchend",c,!0),document.removeEventListener("click",c,!0),document.removeEventListener("keydown",c,!0);for(var y=0;y<a._howls.length;y++)a._howls[y]._emit("unlock")}};return document.addEventListener("touchstart",c,!0),document.addEventListener("touchend",c,!0),document.addEventListener("click",c,!0),document.addEventListener("keydown",c,!0),a}},_obtainHtml5Audio:function(){var a=this||e;if(a._html5AudioPool.length)return a._html5AudioPool.pop();var c=new Audio().play();return c&&typeof Promise<"u"&&(c instanceof Promise||typeof c.then=="function")&&c.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(a){var c=this||e;return a._unlocked&&c._html5AudioPool.push(a),c},_autoSuspend:function(){var a=this;if(!(!a.autoSuspend||!a.ctx||typeof a.ctx.suspend>"u"||!e.usingWebAudio)){for(var c=0;c<a._howls.length;c++)if(a._howls[c]._webAudio){for(var d=0;d<a._howls[c]._sounds.length;d++)if(!a._howls[c]._sounds[d]._paused)return a}return a._suspendTimer&&clearTimeout(a._suspendTimer),a._suspendTimer=setTimeout(function(){if(a.autoSuspend){a._suspendTimer=null,a.state="suspending";var f=function(){a.state="suspended",a._resumeAfterSuspend&&(delete a._resumeAfterSuspend,a._autoResume())};a.ctx.suspend().then(f,f)}},3e4),a}},_autoResume:function(){var a=this;if(!(!a.ctx||typeof a.ctx.resume>"u"||!e.usingWebAudio))return a.state==="running"&&a.ctx.state!=="interrupted"&&a._suspendTimer?(clearTimeout(a._suspendTimer),a._suspendTimer=null):a.state==="suspended"||a.state==="running"&&a.ctx.state==="interrupted"?(a.ctx.resume().then(function(){a.state="running";for(var c=0;c<a._howls.length;c++)a._howls[c]._emit("resume")}),a._suspendTimer&&(clearTimeout(a._suspendTimer),a._suspendTimer=null)):a.state==="suspending"&&(a._resumeAfterSuspend=!0),a}};var e=new s,t=function(a){var c=this;if(!a.src||a.src.length===0){console.error("An array of source files must be passed with any new Howl.");return}c.init(a)};t.prototype={init:function(a){var c=this;return e.ctx||u(),c._autoplay=a.autoplay||!1,c._format=typeof a.format!="string"?a.format:[a.format],c._html5=a.html5||!1,c._muted=a.mute||!1,c._loop=a.loop||!1,c._pool=a.pool||5,c._preload=typeof a.preload=="boolean"||a.preload==="metadata"?a.preload:!0,c._rate=a.rate||1,c._sprite=a.sprite||{},c._src=typeof a.src!="string"?a.src:[a.src],c._volume=a.volume!==void 0?a.volume:1,c._xhr={method:a.xhr&&a.xhr.method?a.xhr.method:"GET",headers:a.xhr&&a.xhr.headers?a.xhr.headers:null,withCredentials:a.xhr&&a.xhr.withCredentials?a.xhr.withCredentials:!1},c._duration=0,c._state="unloaded",c._sounds=[],c._endTimers={},c._queue=[],c._playLock=!1,c._onend=a.onend?[{fn:a.onend}]:[],c._onfade=a.onfade?[{fn:a.onfade}]:[],c._onload=a.onload?[{fn:a.onload}]:[],c._onloaderror=a.onloaderror?[{fn:a.onloaderror}]:[],c._onplayerror=a.onplayerror?[{fn:a.onplayerror}]:[],c._onpause=a.onpause?[{fn:a.onpause}]:[],c._onplay=a.onplay?[{fn:a.onplay}]:[],c._onstop=a.onstop?[{fn:a.onstop}]:[],c._onmute=a.onmute?[{fn:a.onmute}]:[],c._onvolume=a.onvolume?[{fn:a.onvolume}]:[],c._onrate=a.onrate?[{fn:a.onrate}]:[],c._onseek=a.onseek?[{fn:a.onseek}]:[],c._onunlock=a.onunlock?[{fn:a.onunlock}]:[],c._onresume=[],c._webAudio=e.usingWebAudio&&!c._html5,typeof e.ctx<"u"&&e.ctx&&e.autoUnlock&&e._unlockAudio(),e._howls.push(c),c._autoplay&&c._queue.push({event:"play",action:function(){c.play()}}),c._preload&&c._preload!=="none"&&c.load(),c},load:function(){var a=this,c=null;if(e.noAudio){a._emit("loaderror",null,"No audio support.");return}typeof a._src=="string"&&(a._src=[a._src]);for(var d=0;d<a._src.length;d++){var f,m;if(a._format&&a._format[d])f=a._format[d];else{if(m=a._src[d],typeof m!="string"){a._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}f=/^data:audio\/([^;,]+);/i.exec(m),f||(f=/\.([^.]+)$/.exec(m.split("?",1)[0])),f&&(f=f[1].toLowerCase())}if(f||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),f&&e.codecs(f)){c=a._src[d];break}}if(!c){a._emit("loaderror",null,"No codec support for selected audio sources.");return}return a._src=c,a._state="loading",window.location.protocol==="https:"&&c.slice(0,5)==="http:"&&(a._html5=!0,a._webAudio=!1),new n(a),a._webAudio&&r(a),a},play:function(a,c){var d=this,f=null;if(typeof a=="number")f=a,a=null;else{if(typeof a=="string"&&d._state==="loaded"&&!d._sprite[a])return null;if(typeof a>"u"&&(a="__default",!d._playLock)){for(var m=0,x=0;x<d._sounds.length;x++)d._sounds[x]._paused&&!d._sounds[x]._ended&&(m++,f=d._sounds[x]._id);m===1?a=null:f=null}}var p=f?d._soundById(f):d._inactiveSound();if(!p)return null;if(f&&!a&&(a=p._sprite||"__default"),d._state!=="loaded"){p._sprite=a,p._ended=!1;var g=p._id;return d._queue.push({event:"play",action:function(){d.play(g)}}),g}if(f&&!p._paused)return c||d._loadQueue("play"),p._id;d._webAudio&&e._autoResume();var _=Math.max(0,p._seek>0?p._seek:d._sprite[a][0]/1e3),y=Math.max(0,(d._sprite[a][0]+d._sprite[a][1])/1e3-_),v=y*1e3/Math.abs(p._rate),T=d._sprite[a][0]/1e3,A=(d._sprite[a][0]+d._sprite[a][1])/1e3;p._sprite=a,p._ended=!1;var C=function(){p._paused=!1,p._seek=_,p._start=T,p._stop=A,p._loop=!!(p._loop||d._sprite[a][2])};if(_>=A){d._ended(p);return}var R=p._node;if(d._webAudio){var M=function(){d._playLock=!1,C(),d._refreshBuffer(p);var L=p._muted||d._muted?0:p._volume;R.gain.setValueAtTime(L,e.ctx.currentTime),p._playStart=e.ctx.currentTime,typeof R.bufferSource.start>"u"?p._loop?R.bufferSource.noteGrainOn(0,_,86400):R.bufferSource.noteGrainOn(0,_,y):p._loop?R.bufferSource.start(0,_,86400):R.bufferSource.start(0,_,y),v!==1/0&&(d._endTimers[p._id]=setTimeout(d._ended.bind(d,p),v)),c||setTimeout(function(){d._emit("play",p._id),d._loadQueue()},0)};e.state==="running"&&e.ctx.state!=="interrupted"?M():(d._playLock=!0,d.once("resume",M),d._clearTimer(p._id))}else{var b=function(){R.currentTime=_,R.muted=p._muted||d._muted||e._muted||R.muted,R.volume=p._volume*e.volume(),R.playbackRate=p._rate;try{var L=R.play();if(L&&typeof Promise<"u"&&(L instanceof Promise||typeof L.then=="function")?(d._playLock=!0,C(),L.then(function(){d._playLock=!1,R._unlocked=!0,c?d._loadQueue():d._emit("play",p._id)}).catch(function(){d._playLock=!1,d._emit("playerror",p._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),p._ended=!0,p._paused=!0})):c||(d._playLock=!1,C(),d._emit("play",p._id)),R.playbackRate=p._rate,R.paused){d._emit("playerror",p._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");return}a!=="__default"||p._loop?d._endTimers[p._id]=setTimeout(d._ended.bind(d,p),v):(d._endTimers[p._id]=function(){d._ended(p),R.removeEventListener("ended",d._endTimers[p._id],!1)},R.addEventListener("ended",d._endTimers[p._id],!1))}catch(U){d._emit("playerror",p._id,U)}};R.src==="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"&&(R.src=d._src,R.load());var P=window&&window.ejecta||!R.readyState&&e._navigator.isCocoonJS;if(R.readyState>=3||P)b();else{d._playLock=!0,d._state="loading";var B=function(){d._state="loaded",b(),R.removeEventListener(e._canPlayEvent,B,!1)};R.addEventListener(e._canPlayEvent,B,!1),d._clearTimer(p._id)}}return p._id},pause:function(a){var c=this;if(c._state!=="loaded"||c._playLock)return c._queue.push({event:"pause",action:function(){c.pause(a)}}),c;for(var d=c._getSoundIds(a),f=0;f<d.length;f++){c._clearTimer(d[f]);var m=c._soundById(d[f]);if(m&&!m._paused&&(m._seek=c.seek(d[f]),m._rateSeek=0,m._paused=!0,c._stopFade(d[f]),m._node))if(c._webAudio){if(!m._node.bufferSource)continue;typeof m._node.bufferSource.stop>"u"?m._node.bufferSource.noteOff(0):m._node.bufferSource.stop(0),c._cleanBuffer(m._node)}else(!isNaN(m._node.duration)||m._node.duration===1/0)&&m._node.pause();arguments[1]||c._emit("pause",m?m._id:null)}return c},stop:function(a,c){var d=this;if(d._state!=="loaded"||d._playLock)return d._queue.push({event:"stop",action:function(){d.stop(a)}}),d;for(var f=d._getSoundIds(a),m=0;m<f.length;m++){d._clearTimer(f[m]);var x=d._soundById(f[m]);x&&(x._seek=x._start||0,x._rateSeek=0,x._paused=!0,x._ended=!0,d._stopFade(f[m]),x._node&&(d._webAudio?x._node.bufferSource&&(typeof x._node.bufferSource.stop>"u"?x._node.bufferSource.noteOff(0):x._node.bufferSource.stop(0),d._cleanBuffer(x._node)):(!isNaN(x._node.duration)||x._node.duration===1/0)&&(x._node.currentTime=x._start||0,x._node.pause(),x._node.duration===1/0&&d._clearSound(x._node))),c||d._emit("stop",x._id))}return d},mute:function(a,c){var d=this;if(d._state!=="loaded"||d._playLock)return d._queue.push({event:"mute",action:function(){d.mute(a,c)}}),d;if(typeof c>"u")if(typeof a=="boolean")d._muted=a;else return d._muted;for(var f=d._getSoundIds(c),m=0;m<f.length;m++){var x=d._soundById(f[m]);x&&(x._muted=a,x._interval&&d._stopFade(x._id),d._webAudio&&x._node?x._node.gain.setValueAtTime(a?0:x._volume,e.ctx.currentTime):x._node&&(x._node.muted=e._muted?!0:a),d._emit("mute",x._id))}return d},volume:function(){var a=this,c=arguments,d,f;if(c.length===0)return a._volume;if(c.length===1||c.length===2&&typeof c[1]>"u"){var m=a._getSoundIds(),x=m.indexOf(c[0]);x>=0?f=parseInt(c[0],10):d=parseFloat(c[0])}else c.length>=2&&(d=parseFloat(c[0]),f=parseInt(c[1],10));var p;if(typeof d<"u"&&d>=0&&d<=1){if(a._state!=="loaded"||a._playLock)return a._queue.push({event:"volume",action:function(){a.volume.apply(a,c)}}),a;typeof f>"u"&&(a._volume=d),f=a._getSoundIds(f);for(var g=0;g<f.length;g++)p=a._soundById(f[g]),p&&(p._volume=d,c[2]||a._stopFade(f[g]),a._webAudio&&p._node&&!p._muted?p._node.gain.setValueAtTime(d,e.ctx.currentTime):p._node&&!p._muted&&(p._node.volume=d*e.volume()),a._emit("volume",p._id))}else return p=f?a._soundById(f):a._sounds[0],p?p._volume:0;return a},fade:function(a,c,d,f){var m=this;if(m._state!=="loaded"||m._playLock)return m._queue.push({event:"fade",action:function(){m.fade(a,c,d,f)}}),m;a=Math.min(Math.max(0,parseFloat(a)),1),c=Math.min(Math.max(0,parseFloat(c)),1),d=parseFloat(d),m.volume(a,f);for(var x=m._getSoundIds(f),p=0;p<x.length;p++){var g=m._soundById(x[p]);if(g){if(f||m._stopFade(x[p]),m._webAudio&&!g._muted){var _=e.ctx.currentTime,y=_+d/1e3;g._volume=a,g._node.gain.setValueAtTime(a,_),g._node.gain.linearRampToValueAtTime(c,y)}m._startFadeInterval(g,a,c,d,x[p],typeof f>"u")}}return m},_startFadeInterval:function(a,c,d,f,m,x){var p=this,g=c,_=d-c,y=Math.abs(_/.01),v=Math.max(4,y>0?f/y:f),T=Date.now();a._fadeTo=d,a._interval=setInterval(function(){var A=(Date.now()-T)/f;T=Date.now(),g+=_*A,g=Math.round(g*100)/100,_<0?g=Math.max(d,g):g=Math.min(d,g),p._webAudio?a._volume=g:p.volume(g,a._id,!0),x&&(p._volume=g),(d<c&&g<=d||d>c&&g>=d)&&(clearInterval(a._interval),a._interval=null,a._fadeTo=null,p.volume(d,a._id),p._emit("fade",a._id))},v)},_stopFade:function(a){var c=this,d=c._soundById(a);return d&&d._interval&&(c._webAudio&&d._node.gain.cancelScheduledValues(e.ctx.currentTime),clearInterval(d._interval),d._interval=null,c.volume(d._fadeTo,a),d._fadeTo=null,c._emit("fade",a)),c},loop:function(){var a=this,c=arguments,d,f,m;if(c.length===0)return a._loop;if(c.length===1)if(typeof c[0]=="boolean")d=c[0],a._loop=d;else return m=a._soundById(parseInt(c[0],10)),m?m._loop:!1;else c.length===2&&(d=c[0],f=parseInt(c[1],10));for(var x=a._getSoundIds(f),p=0;p<x.length;p++)m=a._soundById(x[p]),m&&(m._loop=d,a._webAudio&&m._node&&m._node.bufferSource&&(m._node.bufferSource.loop=d,d&&(m._node.bufferSource.loopStart=m._start||0,m._node.bufferSource.loopEnd=m._stop,a.playing(x[p])&&(a.pause(x[p],!0),a.play(x[p],!0)))));return a},rate:function(){var a=this,c=arguments,d,f;if(c.length===0)f=a._sounds[0]._id;else if(c.length===1){var m=a._getSoundIds(),x=m.indexOf(c[0]);x>=0?f=parseInt(c[0],10):d=parseFloat(c[0])}else c.length===2&&(d=parseFloat(c[0]),f=parseInt(c[1],10));var p;if(typeof d=="number"){if(a._state!=="loaded"||a._playLock)return a._queue.push({event:"rate",action:function(){a.rate.apply(a,c)}}),a;typeof f>"u"&&(a._rate=d),f=a._getSoundIds(f);for(var g=0;g<f.length;g++)if(p=a._soundById(f[g]),p){a.playing(f[g])&&(p._rateSeek=a.seek(f[g]),p._playStart=a._webAudio?e.ctx.currentTime:p._playStart),p._rate=d,a._webAudio&&p._node&&p._node.bufferSource?p._node.bufferSource.playbackRate.setValueAtTime(d,e.ctx.currentTime):p._node&&(p._node.playbackRate=d);var _=a.seek(f[g]),y=(a._sprite[p._sprite][0]+a._sprite[p._sprite][1])/1e3-_,v=y*1e3/Math.abs(p._rate);(a._endTimers[f[g]]||!p._paused)&&(a._clearTimer(f[g]),a._endTimers[f[g]]=setTimeout(a._ended.bind(a,p),v)),a._emit("rate",p._id)}}else return p=a._soundById(f),p?p._rate:a._rate;return a},seek:function(){var a=this,c=arguments,d,f;if(c.length===0)a._sounds.length&&(f=a._sounds[0]._id);else if(c.length===1){var m=a._getSoundIds(),x=m.indexOf(c[0]);x>=0?f=parseInt(c[0],10):a._sounds.length&&(f=a._sounds[0]._id,d=parseFloat(c[0]))}else c.length===2&&(d=parseFloat(c[0]),f=parseInt(c[1],10));if(typeof f>"u")return 0;if(typeof d=="number"&&(a._state!=="loaded"||a._playLock))return a._queue.push({event:"seek",action:function(){a.seek.apply(a,c)}}),a;var p=a._soundById(f);if(p)if(typeof d=="number"&&d>=0){var g=a.playing(f);g&&a.pause(f,!0),p._seek=d,p._ended=!1,a._clearTimer(f),!a._webAudio&&p._node&&!isNaN(p._node.duration)&&(p._node.currentTime=d);var _=function(){g&&a.play(f,!0),a._emit("seek",f)};if(g&&!a._webAudio){var y=function(){a._playLock?setTimeout(y,0):_()};setTimeout(y,0)}else _()}else if(a._webAudio){var v=a.playing(f)?e.ctx.currentTime-p._playStart:0,T=p._rateSeek?p._rateSeek-p._seek:0;return p._seek+(T+v*Math.abs(p._rate))}else return p._node.currentTime;return a},playing:function(a){var c=this;if(typeof a=="number"){var d=c._soundById(a);return d?!d._paused:!1}for(var f=0;f<c._sounds.length;f++)if(!c._sounds[f]._paused)return!0;return!1},duration:function(a){var c=this,d=c._duration,f=c._soundById(a);return f&&(d=c._sprite[f._sprite][1]/1e3),d},state:function(){return this._state},unload:function(){for(var a=this,c=a._sounds,d=0;d<c.length;d++)c[d]._paused||a.stop(c[d]._id),a._webAudio||(a._clearSound(c[d]._node),c[d]._node.removeEventListener("error",c[d]._errorFn,!1),c[d]._node.removeEventListener(e._canPlayEvent,c[d]._loadFn,!1),c[d]._node.removeEventListener("ended",c[d]._endFn,!1),e._releaseHtml5Audio(c[d]._node)),delete c[d]._node,a._clearTimer(c[d]._id);var f=e._howls.indexOf(a);f>=0&&e._howls.splice(f,1);var m=!0;for(d=0;d<e._howls.length;d++)if(e._howls[d]._src===a._src||a._src.indexOf(e._howls[d]._src)>=0){m=!1;break}return i&&m&&delete i[a._src],e.noAudio=!1,a._state="unloaded",a._sounds=[],a=null,null},on:function(a,c,d,f){var m=this,x=m["_on"+a];return typeof c=="function"&&x.push(f?{id:d,fn:c,once:f}:{id:d,fn:c}),m},off:function(a,c,d){var f=this,m=f["_on"+a],x=0;if(typeof c=="number"&&(d=c,c=null),c||d)for(x=0;x<m.length;x++){var p=d===m[x].id;if(c===m[x].fn&&p||!c&&p){m.splice(x,1);break}}else if(a)f["_on"+a]=[];else{var g=Object.keys(f);for(x=0;x<g.length;x++)g[x].indexOf("_on")===0&&Array.isArray(f[g[x]])&&(f[g[x]]=[])}return f},once:function(a,c,d){var f=this;return f.on(a,c,d,1),f},_emit:function(a,c,d){for(var f=this,m=f["_on"+a],x=m.length-1;x>=0;x--)(!m[x].id||m[x].id===c||a==="load")&&(setTimeout((function(p){p.call(this,c,d)}).bind(f,m[x].fn),0),m[x].once&&f.off(a,m[x].fn,m[x].id));return f._loadQueue(a),f},_loadQueue:function(a){var c=this;if(c._queue.length>0){var d=c._queue[0];d.event===a&&(c._queue.shift(),c._loadQueue()),a||d.action()}return c},_ended:function(a){var c=this,d=a._sprite;if(!c._webAudio&&a._node&&!a._node.paused&&!a._node.ended&&a._node.currentTime<a._stop)return setTimeout(c._ended.bind(c,a),100),c;var f=!!(a._loop||c._sprite[d][2]);if(c._emit("end",a._id),!c._webAudio&&f&&c.stop(a._id,!0).play(a._id),c._webAudio&&f){c._emit("play",a._id),a._seek=a._start||0,a._rateSeek=0,a._playStart=e.ctx.currentTime;var m=(a._stop-a._start)*1e3/Math.abs(a._rate);c._endTimers[a._id]=setTimeout(c._ended.bind(c,a),m)}return c._webAudio&&!f&&(a._paused=!0,a._ended=!0,a._seek=a._start||0,a._rateSeek=0,c._clearTimer(a._id),c._cleanBuffer(a._node),e._autoSuspend()),!c._webAudio&&!f&&c.stop(a._id,!0),c},_clearTimer:function(a){var c=this;if(c._endTimers[a]){if(typeof c._endTimers[a]!="function")clearTimeout(c._endTimers[a]);else{var d=c._soundById(a);d&&d._node&&d._node.removeEventListener("ended",c._endTimers[a],!1)}delete c._endTimers[a]}return c},_soundById:function(a){for(var c=this,d=0;d<c._sounds.length;d++)if(a===c._sounds[d]._id)return c._sounds[d];return null},_inactiveSound:function(){var a=this;a._drain();for(var c=0;c<a._sounds.length;c++)if(a._sounds[c]._ended)return a._sounds[c].reset();return new n(a)},_drain:function(){var a=this,c=a._pool,d=0,f=0;if(!(a._sounds.length<c)){for(f=0;f<a._sounds.length;f++)a._sounds[f]._ended&&d++;for(f=a._sounds.length-1;f>=0;f--){if(d<=c)return;a._sounds[f]._ended&&(a._webAudio&&a._sounds[f]._node&&a._sounds[f]._node.disconnect(0),a._sounds.splice(f,1),d--)}}},_getSoundIds:function(a){var c=this;if(typeof a>"u"){for(var d=[],f=0;f<c._sounds.length;f++)d.push(c._sounds[f]._id);return d}else return[a]},_refreshBuffer:function(a){var c=this;return a._node.bufferSource=e.ctx.createBufferSource(),a._node.bufferSource.buffer=i[c._src],a._panner?a._node.bufferSource.connect(a._panner):a._node.bufferSource.connect(a._node),a._node.bufferSource.loop=a._loop,a._loop&&(a._node.bufferSource.loopStart=a._start||0,a._node.bufferSource.loopEnd=a._stop||0),a._node.bufferSource.playbackRate.setValueAtTime(a._rate,e.ctx.currentTime),c},_cleanBuffer:function(a){var c=this,d=e._navigator&&e._navigator.vendor.indexOf("Apple")>=0;if(!a.bufferSource)return c;if(e._scratchBuffer&&a.bufferSource&&(a.bufferSource.onended=null,a.bufferSource.disconnect(0),d))try{a.bufferSource.buffer=e._scratchBuffer}catch{}return a.bufferSource=null,c},_clearSound:function(a){var c=/MSIE |Trident\//.test(e._navigator&&e._navigator.userAgent);c||(a.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var n=function(a){this._parent=a,this.init()};n.prototype={init:function(){var a=this,c=a._parent;return a._muted=c._muted,a._loop=c._loop,a._volume=c._volume,a._rate=c._rate,a._seek=0,a._paused=!0,a._ended=!0,a._sprite="__default",a._id=++e._counter,c._sounds.push(a),a.create(),a},create:function(){var a=this,c=a._parent,d=e._muted||a._muted||a._parent._muted?0:a._volume;return c._webAudio?(a._node=typeof e.ctx.createGain>"u"?e.ctx.createGainNode():e.ctx.createGain(),a._node.gain.setValueAtTime(d,e.ctx.currentTime),a._node.paused=!0,a._node.connect(e.masterGain)):e.noAudio||(a._node=e._obtainHtml5Audio(),a._errorFn=a._errorListener.bind(a),a._node.addEventListener("error",a._errorFn,!1),a._loadFn=a._loadListener.bind(a),a._node.addEventListener(e._canPlayEvent,a._loadFn,!1),a._endFn=a._endListener.bind(a),a._node.addEventListener("ended",a._endFn,!1),a._node.src=c._src,a._node.preload=c._preload===!0?"auto":c._preload,a._node.volume=d*e.volume(),a._node.load()),a},reset:function(){var a=this,c=a._parent;return a._muted=c._muted,a._loop=c._loop,a._volume=c._volume,a._rate=c._rate,a._seek=0,a._rateSeek=0,a._paused=!0,a._ended=!0,a._sprite="__default",a._id=++e._counter,a},_errorListener:function(){var a=this;a._parent._emit("loaderror",a._id,a._node.error?a._node.error.code:0),a._node.removeEventListener("error",a._errorFn,!1)},_loadListener:function(){var a=this,c=a._parent;c._duration=Math.ceil(a._node.duration*10)/10,Object.keys(c._sprite).length===0&&(c._sprite={__default:[0,c._duration*1e3]}),c._state!=="loaded"&&(c._state="loaded",c._emit("load"),c._loadQueue()),a._node.removeEventListener(e._canPlayEvent,a._loadFn,!1)},_endListener:function(){var a=this,c=a._parent;c._duration===1/0&&(c._duration=Math.ceil(a._node.duration*10)/10,c._sprite.__default[1]===1/0&&(c._sprite.__default[1]=c._duration*1e3),c._ended(a)),a._node.removeEventListener("ended",a._endFn,!1)}};var i={},r=function(a){var c=a._src;if(i[c]){a._duration=i[c].duration,h(a);return}if(/^data:[^;]+;base64,/.test(c)){for(var d=atob(c.split(",")[1]),f=new Uint8Array(d.length),m=0;m<d.length;++m)f[m]=d.charCodeAt(m);l(f.buffer,a)}else{var x=new XMLHttpRequest;x.open(a._xhr.method,c,!0),x.withCredentials=a._xhr.withCredentials,x.responseType="arraybuffer",a._xhr.headers&&Object.keys(a._xhr.headers).forEach(function(p){x.setRequestHeader(p,a._xhr.headers[p])}),x.onload=function(){var p=(x.status+"")[0];if(p!=="0"&&p!=="2"&&p!=="3"){a._emit("loaderror",null,"Failed loading audio file with status: "+x.status+".");return}l(x.response,a)},x.onerror=function(){a._webAudio&&(a._html5=!0,a._webAudio=!1,a._sounds=[],delete i[c],a.load())},o(x)}},o=function(a){try{a.send()}catch{a.onerror()}},l=function(a,c){var d=function(){c._emit("loaderror",null,"Decoding audio data failed.")},f=function(m){m&&c._sounds.length>0?(i[c._src]=m,h(c,m)):d()};typeof Promise<"u"&&e.ctx.decodeAudioData.length===1?e.ctx.decodeAudioData(a).then(f).catch(d):e.ctx.decodeAudioData(a,f,d)},h=function(a,c){c&&!a._duration&&(a._duration=c.duration),Object.keys(a._sprite).length===0&&(a._sprite={__default:[0,a._duration*1e3]}),a._state!=="loaded"&&(a._state="loaded",a._emit("load"),a._loadQueue())},u=function(){if(e.usingWebAudio){try{typeof AudioContext<"u"?e.ctx=new AudioContext:typeof webkitAudioContext<"u"?e.ctx=new webkitAudioContext:e.usingWebAudio=!1}catch{e.usingWebAudio=!1}e.ctx||(e.usingWebAudio=!1);var a=/iP(hone|od|ad)/.test(e._navigator&&e._navigator.platform),c=e._navigator&&e._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),d=c?parseInt(c[1],10):null;if(a&&d&&d<9){var f=/safari/.test(e._navigator&&e._navigator.userAgent.toLowerCase());e._navigator&&!f&&(e.usingWebAudio=!1)}e.usingWebAudio&&(e.masterGain=typeof e.ctx.createGain>"u"?e.ctx.createGainNode():e.ctx.createGain(),e.masterGain.gain.setValueAtTime(e._muted?0:e._volume,e.ctx.currentTime),e.masterGain.connect(e.ctx.destination)),e._setup()}};typeof define=="function"&&define.amd&&define([],function(){return{Howler:e,Howl:t}}),typeof cl<"u"&&(cl.Howler=e,cl.Howl=t),typeof global<"u"?(global.HowlerGlobal=s,global.Howler=e,global.Howl=t,global.Sound=n):typeof window<"u"&&(window.HowlerGlobal=s,window.Howler=e,window.Howl=t,window.Sound=n)})();(function(){"use strict";HowlerGlobal.prototype._pos=[0,0,0],HowlerGlobal.prototype._orientation=[0,0,-1,0,1,0],HowlerGlobal.prototype.stereo=function(e){var t=this;if(!t.ctx||!t.ctx.listener)return t;for(var n=t._howls.length-1;n>=0;n--)t._howls[n].stereo(e);return t},HowlerGlobal.prototype.pos=function(e,t,n){var i=this;if(!i.ctx||!i.ctx.listener)return i;if(t=typeof t!="number"?i._pos[1]:t,n=typeof n!="number"?i._pos[2]:n,typeof e=="number")i._pos=[e,t,n],typeof i.ctx.listener.positionX<"u"?(i.ctx.listener.positionX.setTargetAtTime(i._pos[0],Howler.ctx.currentTime,.1),i.ctx.listener.positionY.setTargetAtTime(i._pos[1],Howler.ctx.currentTime,.1),i.ctx.listener.positionZ.setTargetAtTime(i._pos[2],Howler.ctx.currentTime,.1)):i.ctx.listener.setPosition(i._pos[0],i._pos[1],i._pos[2]);else return i._pos;return i},HowlerGlobal.prototype.orientation=function(e,t,n,i,r,o){var l=this;if(!l.ctx||!l.ctx.listener)return l;var h=l._orientation;if(t=typeof t!="number"?h[1]:t,n=typeof n!="number"?h[2]:n,i=typeof i!="number"?h[3]:i,r=typeof r!="number"?h[4]:r,o=typeof o!="number"?h[5]:o,typeof e=="number")l._orientation=[e,t,n,i,r,o],typeof l.ctx.listener.forwardX<"u"?(l.ctx.listener.forwardX.setTargetAtTime(e,Howler.ctx.currentTime,.1),l.ctx.listener.forwardY.setTargetAtTime(t,Howler.ctx.currentTime,.1),l.ctx.listener.forwardZ.setTargetAtTime(n,Howler.ctx.currentTime,.1),l.ctx.listener.upX.setTargetAtTime(i,Howler.ctx.currentTime,.1),l.ctx.listener.upY.setTargetAtTime(r,Howler.ctx.currentTime,.1),l.ctx.listener.upZ.setTargetAtTime(o,Howler.ctx.currentTime,.1)):l.ctx.listener.setOrientation(e,t,n,i,r,o);else return h;return l},Howl.prototype.init=(function(e){return function(t){var n=this;return n._orientation=t.orientation||[1,0,0],n._stereo=t.stereo||null,n._pos=t.pos||null,n._pannerAttr={coneInnerAngle:typeof t.coneInnerAngle<"u"?t.coneInnerAngle:360,coneOuterAngle:typeof t.coneOuterAngle<"u"?t.coneOuterAngle:360,coneOuterGain:typeof t.coneOuterGain<"u"?t.coneOuterGain:0,distanceModel:typeof t.distanceModel<"u"?t.distanceModel:"inverse",maxDistance:typeof t.maxDistance<"u"?t.maxDistance:1e4,panningModel:typeof t.panningModel<"u"?t.panningModel:"HRTF",refDistance:typeof t.refDistance<"u"?t.refDistance:1,rolloffFactor:typeof t.rolloffFactor<"u"?t.rolloffFactor:1},n._onstereo=t.onstereo?[{fn:t.onstereo}]:[],n._onpos=t.onpos?[{fn:t.onpos}]:[],n._onorientation=t.onorientation?[{fn:t.onorientation}]:[],e.call(this,t)}})(Howl.prototype.init),Howl.prototype.stereo=function(e,t){var n=this;if(!n._webAudio)return n;if(n._state!=="loaded")return n._queue.push({event:"stereo",action:function(){n.stereo(e,t)}}),n;var i=typeof Howler.ctx.createStereoPanner>"u"?"spatial":"stereo";if(typeof t>"u")if(typeof e=="number")n._stereo=e,n._pos=[e,0,0];else return n._stereo;for(var r=n._getSoundIds(t),o=0;o<r.length;o++){var l=n._soundById(r[o]);if(l)if(typeof e=="number")l._stereo=e,l._pos=[e,0,0],l._node&&(l._pannerAttr.panningModel="equalpower",(!l._panner||!l._panner.pan)&&s(l,i),i==="spatial"?typeof l._panner.positionX<"u"?(l._panner.positionX.setValueAtTime(e,Howler.ctx.currentTime),l._panner.positionY.setValueAtTime(0,Howler.ctx.currentTime),l._panner.positionZ.setValueAtTime(0,Howler.ctx.currentTime)):l._panner.setPosition(e,0,0):l._panner.pan.setValueAtTime(e,Howler.ctx.currentTime)),n._emit("stereo",l._id);else return l._stereo}return n},Howl.prototype.pos=function(e,t,n,i){var r=this;if(!r._webAudio)return r;if(r._state!=="loaded")return r._queue.push({event:"pos",action:function(){r.pos(e,t,n,i)}}),r;if(t=typeof t!="number"?0:t,n=typeof n!="number"?-.5:n,typeof i>"u")if(typeof e=="number")r._pos=[e,t,n];else return r._pos;for(var o=r._getSoundIds(i),l=0;l<o.length;l++){var h=r._soundById(o[l]);if(h)if(typeof e=="number")h._pos=[e,t,n],h._node&&((!h._panner||h._panner.pan)&&s(h,"spatial"),typeof h._panner.positionX<"u"?(h._panner.positionX.setValueAtTime(e,Howler.ctx.currentTime),h._panner.positionY.setValueAtTime(t,Howler.ctx.currentTime),h._panner.positionZ.setValueAtTime(n,Howler.ctx.currentTime)):h._panner.setPosition(e,t,n)),r._emit("pos",h._id);else return h._pos}return r},Howl.prototype.orientation=function(e,t,n,i){var r=this;if(!r._webAudio)return r;if(r._state!=="loaded")return r._queue.push({event:"orientation",action:function(){r.orientation(e,t,n,i)}}),r;if(t=typeof t!="number"?r._orientation[1]:t,n=typeof n!="number"?r._orientation[2]:n,typeof i>"u")if(typeof e=="number")r._orientation=[e,t,n];else return r._orientation;for(var o=r._getSoundIds(i),l=0;l<o.length;l++){var h=r._soundById(o[l]);if(h)if(typeof e=="number")h._orientation=[e,t,n],h._node&&(h._panner||(h._pos||(h._pos=r._pos||[0,0,-.5]),s(h,"spatial")),typeof h._panner.orientationX<"u"?(h._panner.orientationX.setValueAtTime(e,Howler.ctx.currentTime),h._panner.orientationY.setValueAtTime(t,Howler.ctx.currentTime),h._panner.orientationZ.setValueAtTime(n,Howler.ctx.currentTime)):h._panner.setOrientation(e,t,n)),r._emit("orientation",h._id);else return h._orientation}return r},Howl.prototype.pannerAttr=function(){var e=this,t=arguments,n,i,r;if(!e._webAudio)return e;if(t.length===0)return e._pannerAttr;if(t.length===1)if(typeof t[0]=="object")n=t[0],typeof i>"u"&&(n.pannerAttr||(n.pannerAttr={coneInnerAngle:n.coneInnerAngle,coneOuterAngle:n.coneOuterAngle,coneOuterGain:n.coneOuterGain,distanceModel:n.distanceModel,maxDistance:n.maxDistance,refDistance:n.refDistance,rolloffFactor:n.rolloffFactor,panningModel:n.panningModel}),e._pannerAttr={coneInnerAngle:typeof n.pannerAttr.coneInnerAngle<"u"?n.pannerAttr.coneInnerAngle:e._coneInnerAngle,coneOuterAngle:typeof n.pannerAttr.coneOuterAngle<"u"?n.pannerAttr.coneOuterAngle:e._coneOuterAngle,coneOuterGain:typeof n.pannerAttr.coneOuterGain<"u"?n.pannerAttr.coneOuterGain:e._coneOuterGain,distanceModel:typeof n.pannerAttr.distanceModel<"u"?n.pannerAttr.distanceModel:e._distanceModel,maxDistance:typeof n.pannerAttr.maxDistance<"u"?n.pannerAttr.maxDistance:e._maxDistance,refDistance:typeof n.pannerAttr.refDistance<"u"?n.pannerAttr.refDistance:e._refDistance,rolloffFactor:typeof n.pannerAttr.rolloffFactor<"u"?n.pannerAttr.rolloffFactor:e._rolloffFactor,panningModel:typeof n.pannerAttr.panningModel<"u"?n.pannerAttr.panningModel:e._panningModel});else return r=e._soundById(parseInt(t[0],10)),r?r._pannerAttr:e._pannerAttr;else t.length===2&&(n=t[0],i=parseInt(t[1],10));for(var o=e._getSoundIds(i),l=0;l<o.length;l++)if(r=e._soundById(o[l]),r){var h=r._pannerAttr;h={coneInnerAngle:typeof n.coneInnerAngle<"u"?n.coneInnerAngle:h.coneInnerAngle,coneOuterAngle:typeof n.coneOuterAngle<"u"?n.coneOuterAngle:h.coneOuterAngle,coneOuterGain:typeof n.coneOuterGain<"u"?n.coneOuterGain:h.coneOuterGain,distanceModel:typeof n.distanceModel<"u"?n.distanceModel:h.distanceModel,maxDistance:typeof n.maxDistance<"u"?n.maxDistance:h.maxDistance,refDistance:typeof n.refDistance<"u"?n.refDistance:h.refDistance,rolloffFactor:typeof n.rolloffFactor<"u"?n.rolloffFactor:h.rolloffFactor,panningModel:typeof n.panningModel<"u"?n.panningModel:h.panningModel};var u=r._panner;u||(r._pos||(r._pos=e._pos||[0,0,-.5]),s(r,"spatial"),u=r._panner),u.coneInnerAngle=h.coneInnerAngle,u.coneOuterAngle=h.coneOuterAngle,u.coneOuterGain=h.coneOuterGain,u.distanceModel=h.distanceModel,u.maxDistance=h.maxDistance,u.refDistance=h.refDistance,u.rolloffFactor=h.rolloffFactor,u.panningModel=h.panningModel}return e},Sound.prototype.init=(function(e){return function(){var t=this,n=t._parent;t._orientation=n._orientation,t._stereo=n._stereo,t._pos=n._pos,t._pannerAttr=n._pannerAttr,e.call(this),t._stereo?n.stereo(t._stereo):t._pos&&n.pos(t._pos[0],t._pos[1],t._pos[2],t._id)}})(Sound.prototype.init),Sound.prototype.reset=(function(e){return function(){var t=this,n=t._parent;return t._orientation=n._orientation,t._stereo=n._stereo,t._pos=n._pos,t._pannerAttr=n._pannerAttr,t._stereo?n.stereo(t._stereo):t._pos?n.pos(t._pos[0],t._pos[1],t._pos[2],t._id):t._panner&&(t._panner.disconnect(0),t._panner=void 0,n._refreshBuffer(t)),e.call(this)}})(Sound.prototype.reset);var s=function(e,t){t=t||"spatial",t==="spatial"?(e._panner=Howler.ctx.createPanner(),e._panner.coneInnerAngle=e._pannerAttr.coneInnerAngle,e._panner.coneOuterAngle=e._pannerAttr.coneOuterAngle,e._panner.coneOuterGain=e._pannerAttr.coneOuterGain,e._panner.distanceModel=e._pannerAttr.distanceModel,e._panner.maxDistance=e._pannerAttr.maxDistance,e._panner.refDistance=e._pannerAttr.refDistance,e._panner.rolloffFactor=e._pannerAttr.rolloffFactor,e._panner.panningModel=e._pannerAttr.panningModel,typeof e._panner.positionX<"u"?(e._panner.positionX.setValueAtTime(e._pos[0],Howler.ctx.currentTime),e._panner.positionY.setValueAtTime(e._pos[1],Howler.ctx.currentTime),e._panner.positionZ.setValueAtTime(e._pos[2],Howler.ctx.currentTime)):e._panner.setPosition(e._pos[0],e._pos[1],e._pos[2]),typeof e._panner.orientationX<"u"?(e._panner.orientationX.setValueAtTime(e._orientation[0],Howler.ctx.currentTime),e._panner.orientationY.setValueAtTime(e._orientation[1],Howler.ctx.currentTime),e._panner.orientationZ.setValueAtTime(e._orientation[2],Howler.ctx.currentTime)):e._panner.setOrientation(e._orientation[0],e._orientation[1],e._orientation[2])):(e._panner=Howler.ctx.createStereoPanner(),e._panner.pan.setValueAtTime(e._stereo,Howler.ctx.currentTime)),e._panner.connect(e._node),e._paused||e._parent.pause(e._id,!0).play(e._id,!0)}})()});var mh="oy-skift-v1",gh=["dash","pulse","shield"];function pl(s="normal",e=null){["normal","assist"].includes(e?.difficulty)&&(s=e.difficulty);let t=s==="assist"?8:5;return{difficulty:s==="assist"?"assist":"normal",sector:e?.sector??0,hp:t,maxHp:t,score:e?.score??0,time:e?.time??0,sectorTime:0,hits:0,kills:0,scrap:0,combo:0,comboTime:0,dashCooldown:0,pulseCooldown:0,dashing:0,invulnerable:1.2,cells:new Set,upgrades:[...e?.upgrades??[]],bossDefeated:!1,dead:!1,won:!1,ended:!1}}function xh(s,e){if(!(!Number.isFinite(e)||e<=0||s.dead||s.won||s.ended)){s.time+=e,s.sectorTime+=e;for(let t of["dashCooldown","pulseCooldown","dashing","invulnerable","comboTime"])s[t]=Math.max(0,s[t]-e);s.comboTime||(s.combo=0)}}var ml=s=>s.upgrades.includes("dash")?.65:1.05,gl=s=>s.upgrades.includes("pulse")?1.8:2.7;function _h(s){return s.dead||s.won||s.ended||s.dashCooldown>0?!1:(s.dashing=.19,s.dashCooldown=ml(s),s.invulnerable=Math.max(s.invulnerable,.28),!0)}function vh(s){return s.dead||s.won||s.ended||s.pulseCooldown>0?!1:(s.pulseCooldown=gl(s),!0)}function yh(s,e=1){return s.dead||s.won||s.ended||s.invulnerable>0||s.dashing>0?!1:(s.hp=Math.max(0,s.hp-Math.max(0,e)),s.hits++,s.combo=0,s.comboTime=0,s.invulnerable=s.difficulty==="assist"?1.65:1.15,s.dead=s.hp===0,!0)}function bi(s,e,t=!0){s.dead||s.won||s.ended||(t&&(s.combo=Math.min(8,s.combo+1),s.comboTime=4.5),s.score+=Math.round(Math.max(0,e)*(1+Math.max(0,s.combo-1)*.2)))}function bh(s,e){return s.cells.has(e)||s.dead||s.ended?!1:(s.cells.add(e),bi(s,350),s.hp=Math.min(s.maxHp,s.hp+1),!0)}function wh(s){return s.dead||s.ended||s.cells.size<3||s.sector===2&&!s.bossDefeated?!1:(bi(s,1e3+Math.max(0,Math.round(150-s.sectorTime))*10+(s.hits===0?800:0),!1),s.ended=!0,s.sector===2&&(s.won=!0),!0)}function Mh(s,e){return!gh.includes(e)||s.upgrades.includes(e)?!1:(s.upgrades.push(e),e==="shield"&&(s.maxHp+=2,s.hp=s.maxHp),!0)}function Sh(s){return!s.ended||s.won||s.sector>=2?!1:(s.sector++,s.hp=s.maxHp,s.sectorTime=0,s.hits=0,s.cells.clear(),s.ended=!1,s.dashCooldown=0,s.pulseCooldown=0,s.dashing=0,s.invulnerable=1.2,s.combo=0,!0)}var Bs=(s,e,t,n=0)=>Number.isFinite(s)?Math.min(t,Math.max(e,s)):n;function Xi(s){let e={version:1,unlocked:0,best:0,wins:0,checkpoint:null,settings:{language:"sv",sound:!0,music:!0,quality:"eco",motion:!0,difficulty:"normal"}};if(!s||typeof s!="object"||Array.isArray(s)||s.version!==1)return e;e.unlocked=Math.floor(Bs(s.unlocked,0,2)),e.best=Math.floor(Bs(s.best,0,1e8)),e.wins=Math.floor(Bs(s.wins,0,1e6));let t=s.checkpoint;t&&Number.isInteger(t.sector)&&t.sector>=0&&t.sector<=2&&t.sector<=e.unlocked&&(e.checkpoint={difficulty:["normal","assist"].includes(t.difficulty)?t.difficulty:s.settings?.difficulty==="assist"?"assist":"normal",sector:t.sector,score:Math.floor(Bs(t.score,0,1e8)),time:Bs(t.time,0,1e7),upgrades:[...new Set(Array.isArray(t.upgrades)?t.upgrades.filter(i=>gh.includes(i)):[])].slice(0,2)});let n=s.settings;if(n&&typeof n=="object"){["sv","en"].includes(n.language)&&(e.settings.language=n.language),["eco","smooth"].includes(n.quality)&&(e.settings.quality=n.quality),["normal","assist"].includes(n.difficulty)&&(e.settings.difficulty=n.difficulty);for(let i of["sound","music","motion"])typeof n[i]=="boolean"&&(e.settings[i]=n[i])}return e}function Ah(s){try{return Xi(JSON.parse(s.getItem(mh)))}catch{return Xi(null)}}function Th(s,e){try{return s.setItem(mh,JSON.stringify(Xi(e))),!0}catch{return!1}}var kr=s=>s>=18e3?"S":s>=13e3?"A":s>=8500?"B":"C",xl=s=>`${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;var jh=0,Kl=1,Kh=2;var Jl=1,Vo=2,In=3,Gn=0,Gt=1,Ft=2,Yn=0,Ei=1,Ql=2,ec=3,tc=4,Jh=5,li=100,Qh=101,eu=102,tu=103,nu=104,iu=200,su=201,ru=202,ou=203,lo=204,co=205,au=206,lu=207,cu=208,hu=209,uu=210,du=211,fu=212,pu=213,mu=214,Ho=0,Go=1,Wo=2,Ci=3,qo=4,Xo=5,Yo=6,$o=7,nc=0,gu=1,xu=2,$n=0,_u=1,vu=2,yu=3,Zo=4,bu=5,wu=6,Mu=7;var ic=300,Fi=301,Bi=302,jo=303,Ko=304,_r=306,ho=1e3,ai=1001,uo=1002,Yt=1003,Su=1004;var vr=1005;var xn=1006,Jo=1007;var fi=1008;var bn=1009,sc=1010,rc=1011,xs=1012,Qo=1013,pi=1014,wn=1015,_s=1016,ea=1017,ta=1018,vs=1020,oc=35902,ac=35899,lc=1021,cc=1022,ln=1023,ls=1026,ys=1027,na=1028,ia=1029,hc=1030,sa=1031;var ra=1033,yr=33776,br=33777,wr=33778,Mr=33779,oa=35840,aa=35841,la=35842,ca=35843,ha=36196,ua=37492,da=37496,fa=37808,pa=37809,ma=37810,ga=37811,xa=37812,_a=37813,va=37814,ya=37815,ba=37816,wa=37817,Ma=37818,Sa=37819,Aa=37820,Ta=37821,Ea=36492,Ca=36494,Ra=36495,Ia=36283,Pa=36284,La=36285,Na=36286;var Ys=2300,fo=2301,ao=2302,Gl=2400,Wl=2401,ql=2402;var Au=3200,Tu=3201;var uc=0,Eu=1,Zn="",Ct="srgb",Ri="srgb-linear",$s="linear",tt="srgb";var Ti=7680;var Xl=519,Cu=512,Ru=513,Iu=514,dc=515,Pu=516,Lu=517,Nu=518,Du=519,Yl=35044,fc=35048;var pc="300 es",gn=2e3,Zs=2001;var Wn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let r=0,o=i.length;r<o;r++)i[r].call(this,e);e.target=null}}},Pt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Eh=1234567,Gs=Math.PI/180,cs=180/Math.PI;function bs(){let s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Pt[s&255]+Pt[s>>8&255]+Pt[s>>16&255]+Pt[s>>24&255]+"-"+Pt[e&255]+Pt[e>>8&255]+"-"+Pt[e>>16&15|64]+Pt[e>>24&255]+"-"+Pt[t&63|128]+Pt[t>>8&255]+"-"+Pt[t>>16&255]+Pt[t>>24&255]+Pt[n&255]+Pt[n>>8&255]+Pt[n>>16&255]+Pt[n>>24&255]).toLowerCase()}function We(s,e,t){return Math.max(e,Math.min(t,s))}function mc(s,e){return(s%e+e)%e}function xf(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function _f(s,e,t){return s!==e?(t-s)/(e-s):0}function Ws(s,e,t){return(1-t)*s+t*e}function vf(s,e,t,n){return Ws(s,e,1-Math.exp(-t*n))}function yf(s,e=1){return e-Math.abs(mc(s,e*2)-e)}function bf(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function wf(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Mf(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Sf(s,e){return s+Math.random()*(e-s)}function Af(s){return s*(.5-Math.random())}function Tf(s){s!==void 0&&(Eh=s);let e=Eh+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ef(s){return s*Gs}function Cf(s){return s*cs}function Rf(s){return(s&s-1)===0&&s!==0}function If(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Pf(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Lf(s,e,t,n,i){let r=Math.cos,o=Math.sin,l=r(t/2),h=o(t/2),u=r((e+n)/2),a=o((e+n)/2),c=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),m=o((n-e)/2);switch(i){case"XYX":s.set(l*a,h*c,h*d,l*u);break;case"YZY":s.set(h*d,l*a,h*c,l*u);break;case"ZXZ":s.set(h*c,h*d,l*a,l*u);break;case"XZX":s.set(l*a,h*m,h*f,l*u);break;case"YXY":s.set(h*f,l*a,h*m,l*u);break;case"ZYZ":s.set(h*m,h*f,l*a,l*u);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function os(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function kt(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}var gc={DEG2RAD:Gs,RAD2DEG:cs,generateUUID:bs,clamp:We,euclideanModulo:mc,mapLinear:xf,inverseLerp:_f,lerp:Ws,damp:vf,pingpong:yf,smoothstep:bf,smootherstep:wf,randInt:Mf,randFloat:Sf,randFloatSpread:Af,seededRandom:Tf,degToRad:Ef,radToDeg:Cf,isPowerOfTwo:Rf,ceilPowerOfTwo:If,floorPowerOfTwo:Pf,setQuaternionFromProperEuler:Lf,normalize:kt,denormalize:os},Ee=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*i+e.x,this.y=r*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},qn=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,o,l){let h=n[i+0],u=n[i+1],a=n[i+2],c=n[i+3],d=r[o+0],f=r[o+1],m=r[o+2],x=r[o+3];if(l===0){e[t+0]=h,e[t+1]=u,e[t+2]=a,e[t+3]=c;return}if(l===1){e[t+0]=d,e[t+1]=f,e[t+2]=m,e[t+3]=x;return}if(c!==x||h!==d||u!==f||a!==m){let p=1-l,g=h*d+u*f+a*m+c*x,_=g>=0?1:-1,y=1-g*g;if(y>Number.EPSILON){let T=Math.sqrt(y),A=Math.atan2(T,g*_);p=Math.sin(p*A)/T,l=Math.sin(l*A)/T}let v=l*_;if(h=h*p+d*v,u=u*p+f*v,a=a*p+m*v,c=c*p+x*v,p===1-l){let T=1/Math.sqrt(h*h+u*u+a*a+c*c);h*=T,u*=T,a*=T,c*=T}}e[t]=h,e[t+1]=u,e[t+2]=a,e[t+3]=c}static multiplyQuaternionsFlat(e,t,n,i,r,o){let l=n[i],h=n[i+1],u=n[i+2],a=n[i+3],c=r[o],d=r[o+1],f=r[o+2],m=r[o+3];return e[t]=l*m+a*c+h*f-u*d,e[t+1]=h*m+a*d+u*c-l*f,e[t+2]=u*m+a*f+l*d-h*c,e[t+3]=a*m-l*c-h*d-u*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,o=e._order,l=Math.cos,h=Math.sin,u=l(n/2),a=l(i/2),c=l(r/2),d=h(n/2),f=h(i/2),m=h(r/2);switch(o){case"XYZ":this._x=d*a*c+u*f*m,this._y=u*f*c-d*a*m,this._z=u*a*m+d*f*c,this._w=u*a*c-d*f*m;break;case"YXZ":this._x=d*a*c+u*f*m,this._y=u*f*c-d*a*m,this._z=u*a*m-d*f*c,this._w=u*a*c+d*f*m;break;case"ZXY":this._x=d*a*c-u*f*m,this._y=u*f*c+d*a*m,this._z=u*a*m+d*f*c,this._w=u*a*c-d*f*m;break;case"ZYX":this._x=d*a*c-u*f*m,this._y=u*f*c+d*a*m,this._z=u*a*m-d*f*c,this._w=u*a*c+d*f*m;break;case"YZX":this._x=d*a*c+u*f*m,this._y=u*f*c+d*a*m,this._z=u*a*m-d*f*c,this._w=u*a*c-d*f*m;break;case"XZY":this._x=d*a*c-u*f*m,this._y=u*f*c-d*a*m,this._z=u*a*m+d*f*c,this._w=u*a*c+d*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],o=t[1],l=t[5],h=t[9],u=t[2],a=t[6],c=t[10],d=n+l+c;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(a-h)*f,this._y=(r-u)*f,this._z=(o-i)*f}else if(n>l&&n>c){let f=2*Math.sqrt(1+n-l-c);this._w=(a-h)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(r+u)/f}else if(l>c){let f=2*Math.sqrt(1+l-n-c);this._w=(r-u)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(h+a)/f}else{let f=2*Math.sqrt(1+c-n-l);this._w=(o-i)/f,this._x=(r+u)/f,this._y=(h+a)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,o=e._w,l=t._x,h=t._y,u=t._z,a=t._w;return this._x=n*a+o*l+i*u-r*h,this._y=i*a+o*h+r*l-n*u,this._z=r*a+o*u+n*h-i*l,this._w=o*a-n*l-i*h-r*u,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,o=this._w,l=o*e._w+n*e._x+i*e._y+r*e._z;if(l<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,l=-l):this.copy(e),l>=1)return this._w=o,this._x=n,this._y=i,this._z=r,this;let h=1-l*l;if(h<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let u=Math.sqrt(h),a=Math.atan2(u,l),c=Math.sin((1-t)*a)/u,d=Math.sin(t*a)/u;return this._w=o*c+this._w*d,this._x=n*c+this._x*d,this._y=i*c+this._y*d,this._z=r*c+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},F=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ch.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ch.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,l=e.z,h=e.w,u=2*(o*i-l*n),a=2*(l*t-r*i),c=2*(r*n-o*t);return this.x=t+h*u+o*c-l*a,this.y=n+h*a+l*u-r*c,this.z=i+h*c+r*a-o*u,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,o=t.x,l=t.y,h=t.z;return this.x=i*h-r*l,this.y=r*o-n*h,this.z=n*l-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return _l.copy(this).projectOnVector(e),this.sub(_l)}reflect(e){return this.sub(_l.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},_l=new F,Ch=new qn,ze=class s{constructor(e,t,n,i,r,o,l,h,u){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,l,h,u)}set(e,t,n,i,r,o,l,h,u){let a=this.elements;return a[0]=e,a[1]=i,a[2]=l,a[3]=t,a[4]=r,a[5]=h,a[6]=n,a[7]=o,a[8]=u,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],l=n[3],h=n[6],u=n[1],a=n[4],c=n[7],d=n[2],f=n[5],m=n[8],x=i[0],p=i[3],g=i[6],_=i[1],y=i[4],v=i[7],T=i[2],A=i[5],C=i[8];return r[0]=o*x+l*_+h*T,r[3]=o*p+l*y+h*A,r[6]=o*g+l*v+h*C,r[1]=u*x+a*_+c*T,r[4]=u*p+a*y+c*A,r[7]=u*g+a*v+c*C,r[2]=d*x+f*_+m*T,r[5]=d*p+f*y+m*A,r[8]=d*g+f*v+m*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],l=e[5],h=e[6],u=e[7],a=e[8];return t*o*a-t*l*u-n*r*a+n*l*h+i*r*u-i*o*h}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],l=e[5],h=e[6],u=e[7],a=e[8],c=a*o-l*u,d=l*h-a*r,f=u*r-o*h,m=t*c+n*d+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return e[0]=c*x,e[1]=(i*u-a*n)*x,e[2]=(l*n-i*o)*x,e[3]=d*x,e[4]=(a*t-i*h)*x,e[5]=(i*r-l*t)*x,e[6]=f*x,e[7]=(n*h-u*t)*x,e[8]=(o*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,o,l){let h=Math.cos(r),u=Math.sin(r);return this.set(n*h,n*u,-n*(h*o+u*l)+o+e,-i*u,i*h,-i*(-u*o+h*l)+l+t,0,0,1),this}scale(e,t){return this.premultiply(vl.makeScale(e,t)),this}rotate(e){return this.premultiply(vl.makeRotation(-e)),this}translate(e,t){return this.premultiply(vl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},vl=new ze;function xc(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function js(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Fu(){let s=js("canvas");return s.style.display="block",s}var Rh={};function hs(s){s in Rh||(Rh[s]=!0,console.warn(s))}function Bu(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var Ih=new ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ph=new ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Nf(){let s={enabled:!0,workingColorSpace:Ri,spaces:{},convert:function(i,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===tt&&(i.r=Hn(i.r),i.g=Hn(i.g),i.b=Hn(i.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===tt&&(i.r=as(i.r),i.g=as(i.g),i.b=as(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Zn?$s:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,o){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return hs("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return hs("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Ri]:{primaries:e,whitePoint:n,transfer:$s,toXYZ:Ih,fromXYZ:Ph,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ct},outputColorSpaceConfig:{drawingBufferColorSpace:Ct}},[Ct]:{primaries:e,whitePoint:n,transfer:tt,toXYZ:Ih,fromXYZ:Ph,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ct}}}),s}var je=Nf();function Hn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function as(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var Yi,po=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Yi===void 0&&(Yi=js("canvas")),Yi.width=e.width,Yi.height=e.height;let i=Yi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=Yi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=js("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let o=0;o<r.length;o++)r[o]=Hn(r[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Hn(t[n]/255)*255):t[n]=Hn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Df=0,us=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Df++}),this.uuid=bs(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let o=0,l=i.length;o<l;o++)i[o].isDataTexture?r.push(yl(i[o].image)):r.push(yl(i[o]))}else r=yl(i);n.url=r}return t||(e.images[this.uuid]=n),n}};function yl(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?po.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Ff=0,bl=new F,Vt=class s extends Wn{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=ai,i=ai,r=xn,o=fi,l=ln,h=bn,u=s.DEFAULT_ANISOTROPY,a=Zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ff++}),this.uuid=bs(),this.name="",this.source=new us(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=o,this.anisotropy=u,this.format=l,this.internalFormat=null,this.type=h,this.offset=new Ee(0,0),this.repeat=new Ee(1,1),this.center=new Ee(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=a,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(bl).x}get height(){return this.source.getSize(bl).y}get depth(){return this.source.getSize(bl).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ic)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ho:e.x=e.x-Math.floor(e.x);break;case ai:e.x=e.x<0?0:1;break;case uo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ho:e.y=e.y-Math.floor(e.y);break;case ai:e.y=e.y<0?0:1;break;case uo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Vt.DEFAULT_IMAGE=null;Vt.DEFAULT_MAPPING=ic;Vt.DEFAULT_ANISOTROPY=1;var xt=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,h=e.elements,u=h[0],a=h[4],c=h[8],d=h[1],f=h[5],m=h[9],x=h[2],p=h[6],g=h[10];if(Math.abs(a-d)<.01&&Math.abs(c-x)<.01&&Math.abs(m-p)<.01){if(Math.abs(a+d)<.1&&Math.abs(c+x)<.1&&Math.abs(m+p)<.1&&Math.abs(u+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let y=(u+1)/2,v=(f+1)/2,T=(g+1)/2,A=(a+d)/4,C=(c+x)/4,R=(m+p)/4;return y>v&&y>T?y<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(y),i=A/n,r=C/n):v>T?v<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(v),n=A/i,r=R/i):T<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(T),n=C/r,i=R/r),this.set(n,i,r,t),this}let _=Math.sqrt((p-m)*(p-m)+(c-x)*(c-x)+(d-a)*(d-a));return Math.abs(_)<.001&&(_=1),this.x=(p-m)/_,this.y=(c-x)/_,this.z=(d-a)/_,this.w=Math.acos((u+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},mo=class extends Wn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t);let i={width:e,height:t,depth:n.depth},r=new Vt(i);this.textures=[];let o=n.count;for(let l=0;l<o;l++)this.textures[l]=r.clone(),this.textures[l].isRenderTargetTexture=!0,this.textures[l].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:xn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new us(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Cn=class extends mo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Ks=class extends Vt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Yt,this.minFilter=Yt,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var go=class extends Vt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Yt,this.minFilter=Yt,this.wrapR=ai,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Rn=class{constructor(e=new F(1/0,1/0,1/0),t=new F(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,l=r.count;o<l;o++)e.isMesh===!0?e.getVertexPosition(o,fn):fn.fromBufferAttribute(r,o),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Vr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Vr.copy(n.boundingBox)),Vr.applyMatrix4(e.matrixWorld),this.union(Vr)}let i=e.children;for(let r=0,o=i.length;r<o;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Us),Hr.subVectors(this.max,Us),$i.subVectors(e.a,Us),Zi.subVectors(e.b,Us),ji.subVectors(e.c,Us),ei.subVectors(Zi,$i),ti.subVectors(ji,Zi),wi.subVectors($i,ji);let t=[0,-ei.z,ei.y,0,-ti.z,ti.y,0,-wi.z,wi.y,ei.z,0,-ei.x,ti.z,0,-ti.x,wi.z,0,-wi.x,-ei.y,ei.x,0,-ti.y,ti.x,0,-wi.y,wi.x,0];return!wl(t,$i,Zi,ji,Hr)||(t=[1,0,0,0,1,0,0,0,1],!wl(t,$i,Zi,ji,Hr))?!1:(Gr.crossVectors(ei,ti),t=[Gr.x,Gr.y,Gr.z],wl(t,$i,Zi,ji,Hr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Un[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Un[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Un[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Un[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Un[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Un[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Un[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Un[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Un),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Un=[new F,new F,new F,new F,new F,new F,new F,new F],fn=new F,Vr=new Rn,$i=new F,Zi=new F,ji=new F,ei=new F,ti=new F,wi=new F,Us=new F,Hr=new F,Gr=new F,Mi=new F;function wl(s,e,t,n,i){for(let r=0,o=s.length-3;r<=o;r+=3){Mi.fromArray(s,r);let l=i.x*Math.abs(Mi.x)+i.y*Math.abs(Mi.y)+i.z*Math.abs(Mi.z),h=e.dot(Mi),u=t.dot(Mi),a=n.dot(Mi);if(Math.max(-Math.max(h,u,a),Math.min(h,u,a))>l)return!1}return!0}var Bf=new Rn,zs=new F,Ml=new F,ci=class{constructor(e=new F,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Bf.setFromPoints(e).getCenter(n);let i=0;for(let r=0,o=e.length;r<o;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zs.subVectors(e,this.center);let t=zs.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(zs,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ml.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zs.copy(e.center).add(Ml)),this.expandByPoint(zs.copy(e.center).sub(Ml))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},zn=new F,Sl=new F,Wr=new F,ni=new F,Al=new F,qr=new F,Tl=new F,xo=class{constructor(e=new F,t=new F(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(zn.copy(this.origin).addScaledVector(this.direction,t),zn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Sl.copy(e).add(t).multiplyScalar(.5),Wr.copy(t).sub(e).normalize(),ni.copy(this.origin).sub(Sl);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Wr),l=ni.dot(this.direction),h=-ni.dot(Wr),u=ni.lengthSq(),a=Math.abs(1-o*o),c,d,f,m;if(a>0)if(c=o*h-l,d=o*l-h,m=r*a,c>=0)if(d>=-m)if(d<=m){let x=1/a;c*=x,d*=x,f=c*(c+o*d+2*l)+d*(o*c+d+2*h)+u}else d=r,c=Math.max(0,-(o*d+l)),f=-c*c+d*(d+2*h)+u;else d=-r,c=Math.max(0,-(o*d+l)),f=-c*c+d*(d+2*h)+u;else d<=-m?(c=Math.max(0,-(-o*r+l)),d=c>0?-r:Math.min(Math.max(-r,-h),r),f=-c*c+d*(d+2*h)+u):d<=m?(c=0,d=Math.min(Math.max(-r,-h),r),f=d*(d+2*h)+u):(c=Math.max(0,-(o*r+l)),d=c>0?r:Math.min(Math.max(-r,-h),r),f=-c*c+d*(d+2*h)+u);else d=o>0?-r:r,c=Math.max(0,-(o*d+l)),f=-c*c+d*(d+2*h)+u;return n&&n.copy(this.origin).addScaledVector(this.direction,c),i&&i.copy(Sl).addScaledVector(Wr,d),f}intersectSphere(e,t){zn.subVectors(e.center,this.origin);let n=zn.dot(this.direction),i=zn.dot(zn)-n*n,r=e.radius*e.radius;if(i>r)return null;let o=Math.sqrt(r-i),l=n-o,h=n+o;return h<0?null:l<0?this.at(h,t):this.at(l,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,o,l,h,u=1/this.direction.x,a=1/this.direction.y,c=1/this.direction.z,d=this.origin;return u>=0?(n=(e.min.x-d.x)*u,i=(e.max.x-d.x)*u):(n=(e.max.x-d.x)*u,i=(e.min.x-d.x)*u),a>=0?(r=(e.min.y-d.y)*a,o=(e.max.y-d.y)*a):(r=(e.max.y-d.y)*a,o=(e.min.y-d.y)*a),n>o||r>i||((r>n||isNaN(n))&&(n=r),(o<i||isNaN(i))&&(i=o),c>=0?(l=(e.min.z-d.z)*c,h=(e.max.z-d.z)*c):(l=(e.max.z-d.z)*c,h=(e.min.z-d.z)*c),n>h||l>i)||((l>n||n!==n)&&(n=l),(h<i||i!==i)&&(i=h),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,zn)!==null}intersectTriangle(e,t,n,i,r){Al.subVectors(t,e),qr.subVectors(n,e),Tl.crossVectors(Al,qr);let o=this.direction.dot(Tl),l;if(o>0){if(i)return null;l=1}else if(o<0)l=-1,o=-o;else return null;ni.subVectors(this.origin,e);let h=l*this.direction.dot(qr.crossVectors(ni,qr));if(h<0)return null;let u=l*this.direction.dot(Al.cross(ni));if(u<0||h+u>o)return null;let a=-l*ni.dot(Tl);return a<0?null:this.at(a/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},rt=class s{constructor(e,t,n,i,r,o,l,h,u,a,c,d,f,m,x,p){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,o,l,h,u,a,c,d,f,m,x,p)}set(e,t,n,i,r,o,l,h,u,a,c,d,f,m,x,p){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=i,g[1]=r,g[5]=o,g[9]=l,g[13]=h,g[2]=u,g[6]=a,g[10]=c,g[14]=d,g[3]=f,g[7]=m,g[11]=x,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/Ki.setFromMatrixColumn(e,0).length(),r=1/Ki.setFromMatrixColumn(e,1).length(),o=1/Ki.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,o=Math.cos(n),l=Math.sin(n),h=Math.cos(i),u=Math.sin(i),a=Math.cos(r),c=Math.sin(r);if(e.order==="XYZ"){let d=o*a,f=o*c,m=l*a,x=l*c;t[0]=h*a,t[4]=-h*c,t[8]=u,t[1]=f+m*u,t[5]=d-x*u,t[9]=-l*h,t[2]=x-d*u,t[6]=m+f*u,t[10]=o*h}else if(e.order==="YXZ"){let d=h*a,f=h*c,m=u*a,x=u*c;t[0]=d+x*l,t[4]=m*l-f,t[8]=o*u,t[1]=o*c,t[5]=o*a,t[9]=-l,t[2]=f*l-m,t[6]=x+d*l,t[10]=o*h}else if(e.order==="ZXY"){let d=h*a,f=h*c,m=u*a,x=u*c;t[0]=d-x*l,t[4]=-o*c,t[8]=m+f*l,t[1]=f+m*l,t[5]=o*a,t[9]=x-d*l,t[2]=-o*u,t[6]=l,t[10]=o*h}else if(e.order==="ZYX"){let d=o*a,f=o*c,m=l*a,x=l*c;t[0]=h*a,t[4]=m*u-f,t[8]=d*u+x,t[1]=h*c,t[5]=x*u+d,t[9]=f*u-m,t[2]=-u,t[6]=l*h,t[10]=o*h}else if(e.order==="YZX"){let d=o*h,f=o*u,m=l*h,x=l*u;t[0]=h*a,t[4]=x-d*c,t[8]=m*c+f,t[1]=c,t[5]=o*a,t[9]=-l*a,t[2]=-u*a,t[6]=f*c+m,t[10]=d-x*c}else if(e.order==="XZY"){let d=o*h,f=o*u,m=l*h,x=l*u;t[0]=h*a,t[4]=-c,t[8]=u*a,t[1]=d*c+x,t[5]=o*a,t[9]=f*c-m,t[2]=m*c-f,t[6]=l*a,t[10]=x*c+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Uf,e,zf)}lookAt(e,t,n){let i=this.elements;return Jt.subVectors(e,t),Jt.lengthSq()===0&&(Jt.z=1),Jt.normalize(),ii.crossVectors(n,Jt),ii.lengthSq()===0&&(Math.abs(n.z)===1?Jt.x+=1e-4:Jt.z+=1e-4,Jt.normalize(),ii.crossVectors(n,Jt)),ii.normalize(),Xr.crossVectors(Jt,ii),i[0]=ii.x,i[4]=Xr.x,i[8]=Jt.x,i[1]=ii.y,i[5]=Xr.y,i[9]=Jt.y,i[2]=ii.z,i[6]=Xr.z,i[10]=Jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,o=n[0],l=n[4],h=n[8],u=n[12],a=n[1],c=n[5],d=n[9],f=n[13],m=n[2],x=n[6],p=n[10],g=n[14],_=n[3],y=n[7],v=n[11],T=n[15],A=i[0],C=i[4],R=i[8],M=i[12],b=i[1],P=i[5],B=i[9],L=i[13],U=i[2],O=i[6],D=i[10],j=i[14],H=i[3],Z=i[7],ae=i[11],de=i[15];return r[0]=o*A+l*b+h*U+u*H,r[4]=o*C+l*P+h*O+u*Z,r[8]=o*R+l*B+h*D+u*ae,r[12]=o*M+l*L+h*j+u*de,r[1]=a*A+c*b+d*U+f*H,r[5]=a*C+c*P+d*O+f*Z,r[9]=a*R+c*B+d*D+f*ae,r[13]=a*M+c*L+d*j+f*de,r[2]=m*A+x*b+p*U+g*H,r[6]=m*C+x*P+p*O+g*Z,r[10]=m*R+x*B+p*D+g*ae,r[14]=m*M+x*L+p*j+g*de,r[3]=_*A+y*b+v*U+T*H,r[7]=_*C+y*P+v*O+T*Z,r[11]=_*R+y*B+v*D+T*ae,r[15]=_*M+y*L+v*j+T*de,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],o=e[1],l=e[5],h=e[9],u=e[13],a=e[2],c=e[6],d=e[10],f=e[14],m=e[3],x=e[7],p=e[11],g=e[15];return m*(+r*h*c-i*u*c-r*l*d+n*u*d+i*l*f-n*h*f)+x*(+t*h*f-t*u*d+r*o*d-i*o*f+i*u*a-r*h*a)+p*(+t*u*c-t*l*f-r*o*c+n*o*f+r*l*a-n*u*a)+g*(-i*l*a-t*h*c+t*l*d+i*o*c-n*o*d+n*h*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],o=e[4],l=e[5],h=e[6],u=e[7],a=e[8],c=e[9],d=e[10],f=e[11],m=e[12],x=e[13],p=e[14],g=e[15],_=c*p*u-x*d*u+x*h*f-l*p*f-c*h*g+l*d*g,y=m*d*u-a*p*u-m*h*f+o*p*f+a*h*g-o*d*g,v=a*x*u-m*c*u+m*l*f-o*x*f-a*l*g+o*c*g,T=m*c*h-a*x*h-m*l*d+o*x*d+a*l*p-o*c*p,A=t*_+n*y+i*v+r*T;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/A;return e[0]=_*C,e[1]=(x*d*r-c*p*r-x*i*f+n*p*f+c*i*g-n*d*g)*C,e[2]=(l*p*r-x*h*r+x*i*u-n*p*u-l*i*g+n*h*g)*C,e[3]=(c*h*r-l*d*r-c*i*u+n*d*u+l*i*f-n*h*f)*C,e[4]=y*C,e[5]=(a*p*r-m*d*r+m*i*f-t*p*f-a*i*g+t*d*g)*C,e[6]=(m*h*r-o*p*r-m*i*u+t*p*u+o*i*g-t*h*g)*C,e[7]=(o*d*r-a*h*r+a*i*u-t*d*u-o*i*f+t*h*f)*C,e[8]=v*C,e[9]=(m*c*r-a*x*r-m*n*f+t*x*f+a*n*g-t*c*g)*C,e[10]=(o*x*r-m*l*r+m*n*u-t*x*u-o*n*g+t*l*g)*C,e[11]=(a*l*r-o*c*r-a*n*u+t*c*u+o*n*f-t*l*f)*C,e[12]=T*C,e[13]=(a*x*i-m*c*i+m*n*d-t*x*d-a*n*p+t*c*p)*C,e[14]=(m*l*i-o*x*i-m*n*h+t*x*h+o*n*p-t*l*p)*C,e[15]=(o*c*i-a*l*i+a*n*h-t*c*h-o*n*d+t*l*d)*C,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,o=e.x,l=e.y,h=e.z,u=r*o,a=r*l;return this.set(u*o+n,u*l-i*h,u*h+i*l,0,u*l+i*h,a*l+n,a*h-i*o,0,u*h-i*l,a*h+i*o,r*h*h+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,o){return this.set(1,n,r,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,o=t._y,l=t._z,h=t._w,u=r+r,a=o+o,c=l+l,d=r*u,f=r*a,m=r*c,x=o*a,p=o*c,g=l*c,_=h*u,y=h*a,v=h*c,T=n.x,A=n.y,C=n.z;return i[0]=(1-(x+g))*T,i[1]=(f+v)*T,i[2]=(m-y)*T,i[3]=0,i[4]=(f-v)*A,i[5]=(1-(d+g))*A,i[6]=(p+_)*A,i[7]=0,i[8]=(m+y)*C,i[9]=(p-_)*C,i[10]=(1-(d+x))*C,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=Ki.set(i[0],i[1],i[2]).length(),o=Ki.set(i[4],i[5],i[6]).length(),l=Ki.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],pn.copy(this);let u=1/r,a=1/o,c=1/l;return pn.elements[0]*=u,pn.elements[1]*=u,pn.elements[2]*=u,pn.elements[4]*=a,pn.elements[5]*=a,pn.elements[6]*=a,pn.elements[8]*=c,pn.elements[9]*=c,pn.elements[10]*=c,t.setFromRotationMatrix(pn),n.x=r,n.y=o,n.z=l,this}makePerspective(e,t,n,i,r,o,l=gn,h=!1){let u=this.elements,a=2*r/(t-e),c=2*r/(n-i),d=(t+e)/(t-e),f=(n+i)/(n-i),m,x;if(h)m=r/(o-r),x=o*r/(o-r);else if(l===gn)m=-(o+r)/(o-r),x=-2*o*r/(o-r);else if(l===Zs)m=-o/(o-r),x=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return u[0]=a,u[4]=0,u[8]=d,u[12]=0,u[1]=0,u[5]=c,u[9]=f,u[13]=0,u[2]=0,u[6]=0,u[10]=m,u[14]=x,u[3]=0,u[7]=0,u[11]=-1,u[15]=0,this}makeOrthographic(e,t,n,i,r,o,l=gn,h=!1){let u=this.elements,a=2/(t-e),c=2/(n-i),d=-(t+e)/(t-e),f=-(n+i)/(n-i),m,x;if(h)m=1/(o-r),x=o/(o-r);else if(l===gn)m=-2/(o-r),x=-(o+r)/(o-r);else if(l===Zs)m=-1/(o-r),x=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return u[0]=a,u[4]=0,u[8]=0,u[12]=d,u[1]=0,u[5]=c,u[9]=0,u[13]=f,u[2]=0,u[6]=0,u[10]=m,u[14]=x,u[3]=0,u[7]=0,u[11]=0,u[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ki=new F,pn=new rt,Uf=new F(0,0,0),zf=new F(1,1,1),ii=new F,Xr=new F,Jt=new F,Lh=new rt,Nh=new qn,_n=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],o=i[4],l=i[8],h=i[1],u=i[5],a=i[9],c=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-a,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,u),this._z=0);break;case"YXZ":this._x=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._y=Math.atan2(l,f),this._z=Math.atan2(h,u)):(this._y=Math.atan2(-c,r),this._z=0);break;case"ZXY":this._x=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-c,f),this._z=Math.atan2(-o,u)):(this._y=0,this._z=Math.atan2(h,r));break;case"ZYX":this._y=Math.asin(-We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(h,r)):(this._x=0,this._z=Math.atan2(-o,u));break;case"YZX":this._z=Math.asin(We(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(-a,u),this._y=Math.atan2(-c,r)):(this._x=0,this._y=Math.atan2(l,f));break;case"XZY":this._z=Math.asin(-We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,u),this._y=Math.atan2(l,r)):(this._x=Math.atan2(-a,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Lh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Lh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Nh.setFromEuler(this),this.setFromQuaternion(Nh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};_n.DEFAULT_ORDER="XYZ";var Js=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Of=0,Dh=new F,Ji=new qn,On=new rt,Yr=new F,Os=new F,kf=new F,Vf=new qn,Fh=new F(1,0,0),Bh=new F(0,1,0),Uh=new F(0,0,1),zh={type:"added"},Hf={type:"removed"},Qi={type:"childadded",child:null},El={type:"childremoved",child:null},Et=class s extends Wn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Of++}),this.uuid=bs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new F,t=new _n,n=new qn,i=new F(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new rt},normalMatrix:{value:new ze}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Js,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.multiply(Ji),this}rotateOnWorldAxis(e,t){return Ji.setFromAxisAngle(e,t),this.quaternion.premultiply(Ji),this}rotateX(e){return this.rotateOnAxis(Fh,e)}rotateY(e){return this.rotateOnAxis(Bh,e)}rotateZ(e){return this.rotateOnAxis(Uh,e)}translateOnAxis(e,t){return Dh.copy(e).applyQuaternion(this.quaternion),this.position.add(Dh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Fh,e)}translateY(e){return this.translateOnAxis(Bh,e)}translateZ(e){return this.translateOnAxis(Uh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(On.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Yr.copy(e):Yr.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?On.lookAt(Os,Yr,this.up):On.lookAt(Yr,Os,this.up),this.quaternion.setFromRotationMatrix(On),i&&(On.extractRotation(i.matrixWorld),Ji.setFromRotationMatrix(On),this.quaternion.premultiply(Ji.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(zh),Qi.child=e,this.dispatchEvent(Qi),Qi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hf),El.child=e,this.dispatchEvent(El),El.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),On.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),On.multiply(e.parent.matrixWorld)),e.applyMatrix4(On),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(zh),Qi.child=e,this.dispatchEvent(Qi),Qi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Os,e,kf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Os,Vf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let r=0,o=i.length;r<o;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(l=>({...l})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(l,h){return l[h.uuid]===void 0&&(l[h.uuid]=h.toJSON(e)),h.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let h=l.shapes;if(Array.isArray(h))for(let u=0,a=h.length;u<a;u++){let c=h[u];r(e.shapes,c)}else r(e.shapes,h)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let h=0,u=this.material.length;h<u;h++)l.push(r(e.materials,this.material[h]));i.material=l}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let l=0;l<this.children.length;l++)i.children.push(this.children[l].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let l=0;l<this.animations.length;l++){let h=this.animations[l];i.animations.push(r(e.animations,h))}}if(t){let l=o(e.geometries),h=o(e.materials),u=o(e.textures),a=o(e.images),c=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);l.length>0&&(n.geometries=l),h.length>0&&(n.materials=h),u.length>0&&(n.textures=u),a.length>0&&(n.images=a),c.length>0&&(n.shapes=c),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(l){let h=[];for(let u in l){let a=l[u];delete a.metadata,h.push(a)}return h}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};Et.DEFAULT_UP=new F(0,1,0);Et.DEFAULT_MATRIX_AUTO_UPDATE=!0;Et.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var mn=new F,kn=new F,Cl=new F,Vn=new F,es=new F,ts=new F,Oh=new F,Rl=new F,Il=new F,Pl=new F,Ll=new xt,Nl=new xt,Dl=new xt,oi=class s{constructor(e=new F,t=new F,n=new F){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),mn.subVectors(e,t),i.cross(mn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){mn.subVectors(i,t),kn.subVectors(n,t),Cl.subVectors(e,t);let o=mn.dot(mn),l=mn.dot(kn),h=mn.dot(Cl),u=kn.dot(kn),a=kn.dot(Cl),c=o*u-l*l;if(c===0)return r.set(0,0,0),null;let d=1/c,f=(u*h-l*a)*d,m=(o*a-l*h)*d;return r.set(1-f-m,m,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Vn)===null?!1:Vn.x>=0&&Vn.y>=0&&Vn.x+Vn.y<=1}static getInterpolation(e,t,n,i,r,o,l,h){return this.getBarycoord(e,t,n,i,Vn)===null?(h.x=0,h.y=0,"z"in h&&(h.z=0),"w"in h&&(h.w=0),null):(h.setScalar(0),h.addScaledVector(r,Vn.x),h.addScaledVector(o,Vn.y),h.addScaledVector(l,Vn.z),h)}static getInterpolatedAttribute(e,t,n,i,r,o){return Ll.setScalar(0),Nl.setScalar(0),Dl.setScalar(0),Ll.fromBufferAttribute(e,t),Nl.fromBufferAttribute(e,n),Dl.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(Ll,r.x),o.addScaledVector(Nl,r.y),o.addScaledVector(Dl,r.z),o}static isFrontFacing(e,t,n,i){return mn.subVectors(n,t),kn.subVectors(e,t),mn.cross(kn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return mn.subVectors(this.c,this.b),kn.subVectors(this.a,this.b),mn.cross(kn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,o,l;es.subVectors(i,n),ts.subVectors(r,n),Rl.subVectors(e,n);let h=es.dot(Rl),u=ts.dot(Rl);if(h<=0&&u<=0)return t.copy(n);Il.subVectors(e,i);let a=es.dot(Il),c=ts.dot(Il);if(a>=0&&c<=a)return t.copy(i);let d=h*c-a*u;if(d<=0&&h>=0&&a<=0)return o=h/(h-a),t.copy(n).addScaledVector(es,o);Pl.subVectors(e,r);let f=es.dot(Pl),m=ts.dot(Pl);if(m>=0&&f<=m)return t.copy(r);let x=f*u-h*m;if(x<=0&&u>=0&&m<=0)return l=u/(u-m),t.copy(n).addScaledVector(ts,l);let p=a*m-f*c;if(p<=0&&c-a>=0&&f-m>=0)return Oh.subVectors(r,i),l=(c-a)/(c-a+(f-m)),t.copy(i).addScaledVector(Oh,l);let g=1/(p+x+d);return o=x*g,l=d*g,t.copy(n).addScaledVector(es,o).addScaledVector(ts,l)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Uu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},$r={h:0,s:0,l:0};function Fl(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}var He=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ct){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,je.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=je.workingColorSpace){return this.r=e,this.g=t,this.b=n,je.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=je.workingColorSpace){if(e=mc(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=Fl(o,r,e+1/3),this.g=Fl(o,r,e),this.b=Fl(o,r,e-1/3)}return je.colorSpaceToWorking(this,i),this}setStyle(e,t=Ct){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=i[1],l=i[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ct){let n=Uu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Hn(e.r),this.g=Hn(e.g),this.b=Hn(e.b),this}copyLinearToSRGB(e){return this.r=as(e.r),this.g=as(e.g),this.b=as(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ct){return je.workingToColorSpace(Lt.copy(this),e),Math.round(We(Lt.r*255,0,255))*65536+Math.round(We(Lt.g*255,0,255))*256+Math.round(We(Lt.b*255,0,255))}getHexString(e=Ct){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=je.workingColorSpace){je.workingToColorSpace(Lt.copy(this),t);let n=Lt.r,i=Lt.g,r=Lt.b,o=Math.max(n,i,r),l=Math.min(n,i,r),h,u,a=(l+o)/2;if(l===o)h=0,u=0;else{let c=o-l;switch(u=a<=.5?c/(o+l):c/(2-o-l),o){case n:h=(i-r)/c+(i<r?6:0);break;case i:h=(r-n)/c+2;break;case r:h=(n-i)/c+4;break}h/=6}return e.h=h,e.s=u,e.l=a,e}getRGB(e,t=je.workingColorSpace){return je.workingToColorSpace(Lt.copy(this),t),e.r=Lt.r,e.g=Lt.g,e.b=Lt.b,e}getStyle(e=Ct){je.workingToColorSpace(Lt.copy(this),e);let t=Lt.r,n=Lt.g,i=Lt.b;return e!==Ct?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(si),this.setHSL(si.h+e,si.s+t,si.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(si),e.getHSL($r);let n=Ws(si.h,$r.h,t),i=Ws(si.s,$r.s,t),r=Ws(si.l,$r.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Lt=new He;He.NAMES=Uu;var Gf=0,hi=class extends Wn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Gf++}),this.uuid=bs(),this.name="",this.type="Material",this.blending=Ei,this.side=Gn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lo,this.blendDst=co,this.blendEquation=li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new He(0,0,0),this.blendAlpha=0,this.depthFunc=Ci,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Xl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ti,this.stencilZFail=Ti,this.stencilZPass=Ti,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ei&&(n.blending=this.blending),this.side!==Gn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==lo&&(n.blendSrc=this.blendSrc),this.blendDst!==co&&(n.blendDst=this.blendDst),this.blendEquation!==li&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ci&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Xl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ti&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ti&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ti&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let o=[];for(let l in r){let h=r[l];delete h.metadata,o.push(h)}return o}if(t){let r=i(e.textures),o=i(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Ht=class extends hi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new He(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _n,this.combine=nc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var bt=new F,Zr=new Ee,Wf=0,Nt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Wf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Yl,this.updateRanges=[],this.gpuType=wn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Zr.fromBufferAttribute(this,t),Zr.applyMatrix3(e),this.setXY(t,Zr.x,Zr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix3(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix4(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyNormalMatrix(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.transformDirection(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=os(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=kt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=os(t,this.array)),t}setX(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=os(t,this.array)),t}setY(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=os(t,this.array)),t}setZ(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=os(t,this.array)),t}setW(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array),r=kt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Yl&&(e.usage=this.usage),e}};var Qs=class extends Nt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var er=class extends Nt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var nt=class extends Nt{constructor(e,t,n){super(new Float32Array(e),t,n)}},qf=0,on=new rt,Bl=new Et,ns=new F,Qt=new Rn,ks=new Rn,Tt=new F,Dt=class s extends Wn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qf++}),this.uuid=bs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(xc(e)?er:Qs)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ze().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return on.makeRotationFromQuaternion(e),this.applyMatrix4(on),this}rotateX(e){return on.makeRotationX(e),this.applyMatrix4(on),this}rotateY(e){return on.makeRotationY(e),this.applyMatrix4(on),this}rotateZ(e){return on.makeRotationZ(e),this.applyMatrix4(on),this}translate(e,t,n){return on.makeTranslation(e,t,n),this.applyMatrix4(on),this}scale(e,t,n){return on.makeScale(e,t,n),this.applyMatrix4(on),this}lookAt(e){return Bl.lookAt(e),Bl.updateMatrix(),this.applyMatrix4(Bl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ns).negate(),this.translate(ns.x,ns.y,ns.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,r=e.length;i<r;i++){let o=e[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new nt(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Rn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new F(-1/0,-1/0,-1/0),new F(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Qt.setFromBufferAttribute(r),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ci);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new F,1/0);return}if(e){let n=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let l=t[r];ks.setFromBufferAttribute(l),this.morphTargetsRelative?(Tt.addVectors(Qt.min,ks.min),Qt.expandByPoint(Tt),Tt.addVectors(Qt.max,ks.max),Qt.expandByPoint(Tt)):(Qt.expandByPoint(ks.min),Qt.expandByPoint(ks.max))}Qt.getCenter(n);let i=0;for(let r=0,o=e.count;r<o;r++)Tt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Tt));if(t)for(let r=0,o=t.length;r<o;r++){let l=t[r],h=this.morphTargetsRelative;for(let u=0,a=l.count;u<a;u++)Tt.fromBufferAttribute(l,u),h&&(ns.fromBufferAttribute(e,u),Tt.add(ns)),i=Math.max(i,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Nt(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),l=[],h=[];for(let R=0;R<n.count;R++)l[R]=new F,h[R]=new F;let u=new F,a=new F,c=new F,d=new Ee,f=new Ee,m=new Ee,x=new F,p=new F;function g(R,M,b){u.fromBufferAttribute(n,R),a.fromBufferAttribute(n,M),c.fromBufferAttribute(n,b),d.fromBufferAttribute(r,R),f.fromBufferAttribute(r,M),m.fromBufferAttribute(r,b),a.sub(u),c.sub(u),f.sub(d),m.sub(d);let P=1/(f.x*m.y-m.x*f.y);isFinite(P)&&(x.copy(a).multiplyScalar(m.y).addScaledVector(c,-f.y).multiplyScalar(P),p.copy(c).multiplyScalar(f.x).addScaledVector(a,-m.x).multiplyScalar(P),l[R].add(x),l[M].add(x),l[b].add(x),h[R].add(p),h[M].add(p),h[b].add(p))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let R=0,M=_.length;R<M;++R){let b=_[R],P=b.start,B=b.count;for(let L=P,U=P+B;L<U;L+=3)g(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let y=new F,v=new F,T=new F,A=new F;function C(R){T.fromBufferAttribute(i,R),A.copy(T);let M=l[R];y.copy(M),y.sub(T.multiplyScalar(T.dot(M))).normalize(),v.crossVectors(A,M);let P=v.dot(h[R])<0?-1:1;o.setXYZW(R,y.x,y.y,y.z,P)}for(let R=0,M=_.length;R<M;++R){let b=_[R],P=b.start,B=b.count;for(let L=P,U=P+B;L<U;L+=3)C(e.getX(L+0)),C(e.getX(L+1)),C(e.getX(L+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Nt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let i=new F,r=new F,o=new F,l=new F,h=new F,u=new F,a=new F,c=new F;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);i.fromBufferAttribute(t,m),r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,p),a.subVectors(o,r),c.subVectors(i,r),a.cross(c),l.fromBufferAttribute(n,m),h.fromBufferAttribute(n,x),u.fromBufferAttribute(n,p),l.add(a),h.add(a),u.add(a),n.setXYZ(m,l.x,l.y,l.z),n.setXYZ(x,h.x,h.y,h.z),n.setXYZ(p,u.x,u.y,u.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),a.subVectors(o,r),c.subVectors(i,r),a.cross(c),n.setXYZ(d+0,a.x,a.y,a.z),n.setXYZ(d+1,a.x,a.y,a.z),n.setXYZ(d+2,a.x,a.y,a.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(l,h){let u=l.array,a=l.itemSize,c=l.normalized,d=new u.constructor(h.length*a),f=0,m=0;for(let x=0,p=h.length;x<p;x++){l.isInterleavedBufferAttribute?f=h[x]*l.data.stride+l.offset:f=h[x]*a;for(let g=0;g<a;g++)d[m++]=u[f++]}return new Nt(d,a,c)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let l in i){let h=i[l],u=e(h,n);t.setAttribute(l,u)}let r=this.morphAttributes;for(let l in r){let h=[],u=r[l];for(let a=0,c=u.length;a<c;a++){let d=u[a],f=e(d,n);h.push(f)}t.morphAttributes[l]=h}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];t.addGroup(u.start,u.count,u.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let h=this.parameters;for(let u in h)h[u]!==void 0&&(e[u]=h[u]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let h in n){let u=n[h];e.data.attributes[h]=u.toJSON(e.data)}let i={},r=!1;for(let h in this.morphAttributes){let u=this.morphAttributes[h],a=[];for(let c=0,d=u.length;c<d;c++){let f=u[c];a.push(f.toJSON(e.data))}a.length>0&&(i[h]=a,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let l=this.boundingSphere;return l!==null&&(e.data.boundingSphere=l.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let u in i){let a=i[u];this.setAttribute(u,a.clone(t))}let r=e.morphAttributes;for(let u in r){let a=[],c=r[u];for(let d=0,f=c.length;d<f;d++)a.push(c[d].clone(t));this.morphAttributes[u]=a}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let u=0,a=o.length;u<a;u++){let c=o[u];this.addGroup(c.start,c.count,c.materialIndex)}let l=e.boundingBox;l!==null&&(this.boundingBox=l.clone());let h=e.boundingSphere;return h!==null&&(this.boundingSphere=h.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},kh=new rt,Si=new xo,jr=new ci,Vh=new F,Kr=new F,Jr=new F,Qr=new F,Ul=new F,eo=new F,Hh=new F,to=new F,ht=class extends Et{constructor(e=new Dt,t=new Ht){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=i.length;r<o;r++){let l=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=r}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let l=this.morphTargetInfluences;if(r&&l){eo.set(0,0,0);for(let h=0,u=r.length;h<u;h++){let a=l[h],c=r[h];a!==0&&(Ul.fromBufferAttribute(c,e),o?eo.addScaledVector(Ul,a):eo.addScaledVector(Ul.sub(t),a))}t.add(eo)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),jr.copy(n.boundingSphere),jr.applyMatrix4(r),Si.copy(e.ray).recast(e.near),!(jr.containsPoint(Si.origin)===!1&&(Si.intersectSphere(jr,Vh)===null||Si.origin.distanceToSquared(Vh)>(e.far-e.near)**2))&&(kh.copy(r).invert(),Si.copy(e.ray).applyMatrix4(kh),!(n.boundingBox!==null&&Si.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Si)))}_computeIntersections(e,t,n){let i,r=this.geometry,o=this.material,l=r.index,h=r.attributes.position,u=r.attributes.uv,a=r.attributes.uv1,c=r.attributes.normal,d=r.groups,f=r.drawRange;if(l!==null)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let p=d[m],g=o[p.materialIndex],_=Math.max(p.start,f.start),y=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let v=_,T=y;v<T;v+=3){let A=l.getX(v),C=l.getX(v+1),R=l.getX(v+2);i=no(this,g,e,n,u,a,c,A,C,R),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){let _=l.getX(p),y=l.getX(p+1),v=l.getX(p+2);i=no(this,o,e,n,u,a,c,_,y,v),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}else if(h!==void 0)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let p=d[m],g=o[p.materialIndex],_=Math.max(p.start,f.start),y=Math.min(h.count,Math.min(p.start+p.count,f.start+f.count));for(let v=_,T=y;v<T;v+=3){let A=v,C=v+1,R=v+2;i=no(this,g,e,n,u,a,c,A,C,R),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),x=Math.min(h.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){let _=p,y=p+1,v=p+2;i=no(this,o,e,n,u,a,c,_,y,v),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}}};function Xf(s,e,t,n,i,r,o,l){let h;if(e.side===Gt?h=n.intersectTriangle(o,r,i,!0,l):h=n.intersectTriangle(i,r,o,e.side===Gn,l),h===null)return null;to.copy(l),to.applyMatrix4(s.matrixWorld);let u=t.ray.origin.distanceTo(to);return u<t.near||u>t.far?null:{distance:u,point:to.clone(),object:s}}function no(s,e,t,n,i,r,o,l,h,u){s.getVertexPosition(l,Kr),s.getVertexPosition(h,Jr),s.getVertexPosition(u,Qr);let a=Xf(s,e,t,n,Kr,Jr,Qr,Hh);if(a){let c=new F;oi.getBarycoord(Hh,Kr,Jr,Qr,c),i&&(a.uv=oi.getInterpolatedAttribute(i,l,h,u,c,new Ee)),r&&(a.uv1=oi.getInterpolatedAttribute(r,l,h,u,c,new Ee)),o&&(a.normal=oi.getInterpolatedAttribute(o,l,h,u,c,new F),a.normal.dot(n.direction)>0&&a.normal.multiplyScalar(-1));let d={a:l,b:h,c:u,normal:new F,materialIndex:0};oi.getNormal(Kr,Jr,Qr,d.normal),a.face=d,a.barycoord=c}return a}var vn=class s extends Dt{constructor(e=1,t=1,n=1,i=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:o};let l=this;i=Math.floor(i),r=Math.floor(r),o=Math.floor(o);let h=[],u=[],a=[],c=[],d=0,f=0;m("z","y","x",-1,-1,n,t,e,o,r,0),m("z","y","x",1,-1,n,t,-e,o,r,1),m("x","z","y",1,1,e,n,t,i,o,2),m("x","z","y",1,-1,e,n,-t,i,o,3),m("x","y","z",1,-1,e,t,n,i,r,4),m("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(h),this.setAttribute("position",new nt(u,3)),this.setAttribute("normal",new nt(a,3)),this.setAttribute("uv",new nt(c,2));function m(x,p,g,_,y,v,T,A,C,R,M){let b=v/C,P=T/R,B=v/2,L=T/2,U=A/2,O=C+1,D=R+1,j=0,H=0,Z=new F;for(let ae=0;ae<D;ae++){let de=ae*P-L;for(let re=0;re<O;re++){let Ze=re*b-B;Z[x]=Ze*_,Z[p]=de*y,Z[g]=U,u.push(Z.x,Z.y,Z.z),Z[x]=0,Z[p]=0,Z[g]=A>0?1:-1,a.push(Z.x,Z.y,Z.z),c.push(re/C),c.push(1-ae/R),j+=1}}for(let ae=0;ae<R;ae++)for(let de=0;de<C;de++){let re=d+de+O*ae,Ze=d+de+O*(ae+1),et=d+(de+1)+O*(ae+1),Ye=d+(de+1)+O*ae;h.push(re,Ze,Ye),h.push(Ze,et,Ye),H+=6}l.addGroup(f,H,M),f+=H,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Ui(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Bt(s){let e={};for(let t=0;t<s.length;t++){let n=Ui(s[t]);for(let i in n)e[i]=n[i]}return e}function Yf(s){let e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function _c(s){let e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:je.workingColorSpace}var zu={clone:Ui,merge:Bt},$f=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Zf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,yn=class extends hi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$f,this.fragmentShader=Zf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ui(e.uniforms),this.uniformsGroups=Yf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},tr=class extends Et{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=gn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ri=new F,Gh=new Ee,Wh=new Ee,Xt=class extends tr{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=cs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Gs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return cs*2*Math.atan(Math.tan(Gs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ri.x,ri.y).multiplyScalar(-e/ri.z),ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ri.x,ri.y).multiplyScalar(-e/ri.z)}getViewSize(e,t){return this.getViewBounds(e,Gh,Wh),t.subVectors(Wh,Gh)}setViewOffset(e,t,n,i,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Gs*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let h=o.fullWidth,u=o.fullHeight;r+=o.offsetX*i/h,t-=o.offsetY*n/u,i*=o.width/h,n*=o.height/u}let l=this.filmOffset;l!==0&&(r+=e*l/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},is=-90,ss=1,_o=class extends Et{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Xt(is,ss,e,t);i.layers=this.layers,this.add(i);let r=new Xt(is,ss,e,t);r.layers=this.layers,this.add(r);let o=new Xt(is,ss,e,t);o.layers=this.layers,this.add(o);let l=new Xt(is,ss,e,t);l.layers=this.layers,this.add(l);let h=new Xt(is,ss,e,t);h.layers=this.layers,this.add(h);let u=new Xt(is,ss,e,t);u.layers=this.layers,this.add(u)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,o,l,h]=t;for(let u of t)this.remove(u);if(e===gn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),l.up.set(0,1,0),l.lookAt(0,0,1),h.up.set(0,1,0),h.lookAt(0,0,-1);else if(e===Zs)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),l.up.set(0,-1,0),l.lookAt(0,0,1),h.up.set(0,-1,0),h.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let u of t)this.add(u),u.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,l,h,u,a]=this.children,c=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,o),e.setRenderTarget(n,2,i),e.render(t,l),e.setRenderTarget(n,3,i),e.render(t,h),e.setRenderTarget(n,4,i),e.render(t,u),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,i),e.render(t,a),e.setRenderTarget(c,d,f),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},nr=class extends Vt{constructor(e=[],t=Fi,n,i,r,o,l,h,u,a){super(e,t,n,i,r,o,l,h,u,a),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},vo=class extends Cn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new nr(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new vn(5,5,5),r=new yn({name:"CubemapFromEquirect",uniforms:Ui(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Gt,blending:Yn});r.uniforms.tEquirect.value=t;let o=new ht(i,r),l=t.minFilter;return t.minFilter===fi&&(t.minFilter=xn),new _o(1,10,this).update(e,o),t.minFilter=l,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(r)}},ct=class extends Et{constructor(){super(),this.isGroup=!0,this.type="Group"}},jf={type:"move"},ds=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ct,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ct,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new F,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new F),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ct,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new F,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new F),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,o=null,l=this._targetRay,h=this._grip,u=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(u&&e.hand){o=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),g=this._getHandJoint(u,x);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}let a=u.joints["index-finger-tip"],c=u.joints["thumb-tip"],d=a.position.distanceTo(c.position),f=.02,m=.005;u.inputState.pinching&&d>f+m?(u.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!u.inputState.pinching&&d<=f-m&&(u.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else h!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(h.matrix.fromArray(r.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,r.linearVelocity?(h.hasLinearVelocity=!0,h.linearVelocity.copy(r.linearVelocity)):h.hasLinearVelocity=!1,r.angularVelocity?(h.hasAngularVelocity=!0,h.angularVelocity.copy(r.angularVelocity)):h.hasAngularVelocity=!1));l!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(l.matrix.fromArray(i.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,i.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(i.linearVelocity)):l.hasLinearVelocity=!1,i.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(i.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(jf)))}return l!==null&&(l.visible=i!==null),h!==null&&(h.visible=r!==null),u!==null&&(u.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ct;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var ir=class s{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new He(e),this.near=t,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},sr=class extends Et{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new _n,this.environmentIntensity=1,this.environmentRotation=new _n,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var yo=class extends Vt{constructor(e=null,t=1,n=1,i,r,o,l,h,u=Yt,a=Yt,c,d){super(null,o,l,h,u,a,i,r,c,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var fs=class extends Nt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},rs=new rt,qh=new rt,io=[],Xh=new Rn,Kf=new rt,Vs=new ht,Hs=new ci,rr=class extends ht{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new fs(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Kf)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Rn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,rs),Xh.copy(e.boundingBox).applyMatrix4(rs),this.boundingBox.union(Xh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ci),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,rs),Hs.copy(e.boundingSphere).applyMatrix4(rs),this.boundingSphere.union(Hs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let l=0;l<n.length;l++)n[l]=i[o+l]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Vs.geometry=this.geometry,Vs.material=this.material,Vs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Hs.copy(this.boundingSphere),Hs.applyMatrix4(n),e.ray.intersectsSphere(Hs)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,rs),qh.multiplyMatrices(n,rs),Vs.matrixWorld=qh,Vs.raycast(e,io);for(let o=0,l=io.length;o<l;o++){let h=io[o];h.instanceId=r,h.object=this,t.push(h)}io.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new fs(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new yo(new Float32Array(i*this.count),i,this.count,na,wn));let r=this.morphTexture.source.data.data,o=0;for(let u=0;u<n.length;u++)o+=n[u];let l=this.geometry.morphTargetsRelative?1:1-o,h=i*e;r[h]=l,r.set(n,h+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},zl=new F,Jf=new F,Qf=new ze,En=class{constructor(e=new F(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=zl.subVectors(n,t).cross(Jf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(zl),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Qf.getNormalMatrix(e),i=this.coplanarPoint(zl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ai=new ci,ep=new Ee(.5,.5),so=new F,ps=class{constructor(e=new En,t=new En,n=new En,i=new En,r=new En,o=new En){this.planes=[e,t,n,i,r,o]}set(e,t,n,i,r,o){let l=this.planes;return l[0].copy(e),l[1].copy(t),l[2].copy(n),l[3].copy(i),l[4].copy(r),l[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=gn,n=!1){let i=this.planes,r=e.elements,o=r[0],l=r[1],h=r[2],u=r[3],a=r[4],c=r[5],d=r[6],f=r[7],m=r[8],x=r[9],p=r[10],g=r[11],_=r[12],y=r[13],v=r[14],T=r[15];if(i[0].setComponents(u-o,f-a,g-m,T-_).normalize(),i[1].setComponents(u+o,f+a,g+m,T+_).normalize(),i[2].setComponents(u+l,f+c,g+x,T+y).normalize(),i[3].setComponents(u-l,f-c,g-x,T-y).normalize(),n)i[4].setComponents(h,d,p,v).normalize(),i[5].setComponents(u-h,f-d,g-p,T-v).normalize();else if(i[4].setComponents(u-h,f-d,g-p,T-v).normalize(),t===gn)i[5].setComponents(u+h,f+d,g+p,T+v).normalize();else if(t===Zs)i[5].setComponents(h,d,p,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ai.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ai.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ai)}intersectsSprite(e){Ai.center.set(0,0,0);let t=ep.distanceTo(e.center);return Ai.radius=.7071067811865476+t,Ai.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ai)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(so.x=i.normal.x>0?e.max.x:e.min.x,so.y=i.normal.y>0?e.max.y:e.min.y,so.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(so)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ms=class extends Vt{constructor(e,t,n,i,r,o,l,h,u){super(e,t,n,i,r,o,l,h,u),this.isCanvasTexture=!0,this.needsUpdate=!0}},or=class extends Vt{constructor(e,t,n=pi,i,r,o,l=Yt,h=Yt,u,a=ls,c=1){if(a!==ls&&a!==ys)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:c};super(d,i,r,o,l,h,a,n,u),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new us(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ar=class extends Vt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var lr=class s extends Dt{constructor(e=1,t=1,n=1,i=32,r=1,o=!1,l=0,h=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:l,thetaLength:h};let u=this;i=Math.floor(i),r=Math.floor(r);let a=[],c=[],d=[],f=[],m=0,x=[],p=n/2,g=0;_(),o===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(a),this.setAttribute("position",new nt(c,3)),this.setAttribute("normal",new nt(d,3)),this.setAttribute("uv",new nt(f,2));function _(){let v=new F,T=new F,A=0,C=(t-e)/n;for(let R=0;R<=r;R++){let M=[],b=R/r,P=b*(t-e)+e;for(let B=0;B<=i;B++){let L=B/i,U=L*h+l,O=Math.sin(U),D=Math.cos(U);T.x=P*O,T.y=-b*n+p,T.z=P*D,c.push(T.x,T.y,T.z),v.set(O,C,D).normalize(),d.push(v.x,v.y,v.z),f.push(L,1-b),M.push(m++)}x.push(M)}for(let R=0;R<i;R++)for(let M=0;M<r;M++){let b=x[M][R],P=x[M+1][R],B=x[M+1][R+1],L=x[M][R+1];(e>0||M!==0)&&(a.push(b,P,L),A+=3),(t>0||M!==r-1)&&(a.push(P,B,L),A+=3)}u.addGroup(g,A,0),g+=A}function y(v){let T=m,A=new Ee,C=new F,R=0,M=v===!0?e:t,b=v===!0?1:-1;for(let B=1;B<=i;B++)c.push(0,p*b,0),d.push(0,b,0),f.push(.5,.5),m++;let P=m;for(let B=0;B<=i;B++){let U=B/i*h+l,O=Math.cos(U),D=Math.sin(U);C.x=M*D,C.y=p*b,C.z=M*O,c.push(C.x,C.y,C.z),d.push(0,b,0),A.x=O*.5+.5,A.y=D*.5*b+.5,f.push(A.x,A.y),m++}for(let B=0;B<i;B++){let L=T+B,U=P+B;v===!0?a.push(U,U+1,L):a.push(U+1,U,L),R+=3}u.addGroup(g,R,v===!0?1:2),g+=R}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var bo=class s extends Dt{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let r=[],o=[];l(i),u(n),a(),this.setAttribute("position",new nt(r,3)),this.setAttribute("normal",new nt(r.slice(),3)),this.setAttribute("uv",new nt(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function l(_){let y=new F,v=new F,T=new F;for(let A=0;A<t.length;A+=3)f(t[A+0],y),f(t[A+1],v),f(t[A+2],T),h(y,v,T,_)}function h(_,y,v,T){let A=T+1,C=[];for(let R=0;R<=A;R++){C[R]=[];let M=_.clone().lerp(v,R/A),b=y.clone().lerp(v,R/A),P=A-R;for(let B=0;B<=P;B++)B===0&&R===A?C[R][B]=M:C[R][B]=M.clone().lerp(b,B/P)}for(let R=0;R<A;R++)for(let M=0;M<2*(A-R)-1;M++){let b=Math.floor(M/2);M%2===0?(d(C[R][b+1]),d(C[R+1][b]),d(C[R][b])):(d(C[R][b+1]),d(C[R+1][b+1]),d(C[R+1][b]))}}function u(_){let y=new F;for(let v=0;v<r.length;v+=3)y.x=r[v+0],y.y=r[v+1],y.z=r[v+2],y.normalize().multiplyScalar(_),r[v+0]=y.x,r[v+1]=y.y,r[v+2]=y.z}function a(){let _=new F;for(let y=0;y<r.length;y+=3){_.x=r[y+0],_.y=r[y+1],_.z=r[y+2];let v=p(_)/2/Math.PI+.5,T=g(_)/Math.PI+.5;o.push(v,1-T)}m(),c()}function c(){for(let _=0;_<o.length;_+=6){let y=o[_+0],v=o[_+2],T=o[_+4],A=Math.max(y,v,T),C=Math.min(y,v,T);A>.9&&C<.1&&(y<.2&&(o[_+0]+=1),v<.2&&(o[_+2]+=1),T<.2&&(o[_+4]+=1))}}function d(_){r.push(_.x,_.y,_.z)}function f(_,y){let v=_*3;y.x=e[v+0],y.y=e[v+1],y.z=e[v+2]}function m(){let _=new F,y=new F,v=new F,T=new F,A=new Ee,C=new Ee,R=new Ee;for(let M=0,b=0;M<r.length;M+=9,b+=6){_.set(r[M+0],r[M+1],r[M+2]),y.set(r[M+3],r[M+4],r[M+5]),v.set(r[M+6],r[M+7],r[M+8]),A.set(o[b+0],o[b+1]),C.set(o[b+2],o[b+3]),R.set(o[b+4],o[b+5]),T.copy(_).add(y).add(v).divideScalar(3);let P=p(T);x(A,b+0,_,P),x(C,b+2,y,P),x(R,b+4,v,P)}}function x(_,y,v,T){T<0&&_.x===1&&(o[y]=_.x-1),v.x===0&&v.z===0&&(o[y]=T/2/Math.PI+.5)}function p(_){return Math.atan2(_.z,-_.x)}function g(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.vertices,e.indices,e.radius,e.details)}};var an=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),i=0,r=n.length,o;t?o=t:o=e*n[r-1];let l=0,h=r-1,u;for(;l<=h;)if(i=Math.floor(l+(h-l)/2),u=n[i]-o,u<0)l=i+1;else if(u>0)h=i-1;else{h=i;break}if(i=h,n[i]===o)return i/(r-1);let a=n[i],d=n[i+1]-a,f=(o-a)/d;return(i+f)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let o=this.getPoint(i),l=this.getPoint(r),h=t||(o.isVector2?new Ee:new F);return h.copy(l).sub(o).normalize(),h}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new F,i=[],r=[],o=[],l=new F,h=new rt;for(let f=0;f<=e;f++){let m=f/e;i[f]=this.getTangentAt(m,new F)}r[0]=new F,o[0]=new F;let u=Number.MAX_VALUE,a=Math.abs(i[0].x),c=Math.abs(i[0].y),d=Math.abs(i[0].z);a<=u&&(u=a,n.set(1,0,0)),c<=u&&(u=c,n.set(0,1,0)),d<=u&&n.set(0,0,1),l.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],l),o[0].crossVectors(i[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),l.crossVectors(i[f-1],i[f]),l.length()>Number.EPSILON){l.normalize();let m=Math.acos(We(i[f-1].dot(i[f]),-1,1));r[f].applyMatrix4(h.makeRotationAxis(l,m))}o[f].crossVectors(i[f],r[f])}if(t===!0){let f=Math.acos(We(r[0].dot(r[e]),-1,1));f/=e,i[0].dot(l.crossVectors(r[0],r[e]))>0&&(f=-f);for(let m=1;m<=e;m++)r[m].applyMatrix4(h.makeRotationAxis(i[m],f*m)),o[m].crossVectors(i[m],r[m])}return{tangents:i,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},cr=class extends an{constructor(e=0,t=0,n=1,i=1,r=0,o=Math.PI*2,l=!1,h=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=l,this.aRotation=h}getPoint(e,t=new Ee){let n=t,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(o?r=0:r=i),this.aClockwise===!0&&!o&&(r===i?r=-i:r=r-i);let l=this.aStartAngle+e*r,h=this.aX+this.xRadius*Math.cos(l),u=this.aY+this.yRadius*Math.sin(l);if(this.aRotation!==0){let a=Math.cos(this.aRotation),c=Math.sin(this.aRotation),d=h-this.aX,f=u-this.aY;h=d*a-f*c+this.aX,u=d*c+f*a+this.aY}return n.set(h,u)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},wo=class extends cr{constructor(e,t,n,i,r,o){super(e,t,n,n,i,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function vc(){let s=0,e=0,t=0,n=0;function i(r,o,l,h){s=r,e=l,t=-3*r+3*o-2*l-h,n=2*r-2*o+l+h}return{initCatmullRom:function(r,o,l,h,u){i(o,l,u*(l-r),u*(h-o))},initNonuniformCatmullRom:function(r,o,l,h,u,a,c){let d=(o-r)/u-(l-r)/(u+a)+(l-o)/a,f=(l-o)/a-(h-o)/(a+c)+(h-l)/c;d*=a,f*=a,i(o,l,d,f)},calc:function(r){let o=r*r,l=o*r;return s+e*r+t*o+n*l}}}var ro=new F,Ol=new vc,kl=new vc,Vl=new vc,gs=class extends an{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new F){let n=t,i=this.points,r=i.length,o=(r-(this.closed?0:1))*e,l=Math.floor(o),h=o-l;this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/r)+1)*r:h===0&&l===r-1&&(l=r-2,h=1);let u,a;this.closed||l>0?u=i[(l-1)%r]:(ro.subVectors(i[0],i[1]).add(i[0]),u=ro);let c=i[l%r],d=i[(l+1)%r];if(this.closed||l+2<r?a=i[(l+2)%r]:(ro.subVectors(i[r-1],i[r-2]).add(i[r-1]),a=ro),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(u.distanceToSquared(c),f),x=Math.pow(c.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(a),f);x<1e-4&&(x=1),m<1e-4&&(m=x),p<1e-4&&(p=x),Ol.initNonuniformCatmullRom(u.x,c.x,d.x,a.x,m,x,p),kl.initNonuniformCatmullRom(u.y,c.y,d.y,a.y,m,x,p),Vl.initNonuniformCatmullRom(u.z,c.z,d.z,a.z,m,x,p)}else this.curveType==="catmullrom"&&(Ol.initCatmullRom(u.x,c.x,d.x,a.x,this.tension),kl.initCatmullRom(u.y,c.y,d.y,a.y,this.tension),Vl.initCatmullRom(u.z,c.z,d.z,a.z,this.tension));return n.set(Ol.calc(h),kl.calc(h),Vl.calc(h)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new F().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Yh(s,e,t,n,i){let r=(n-e)*.5,o=(i-t)*.5,l=s*s,h=s*l;return(2*t-2*n+r+o)*h+(-3*t+3*n-2*r-o)*l+r*s+t}function tp(s,e){let t=1-s;return t*t*e}function np(s,e){return 2*(1-s)*s*e}function ip(s,e){return s*s*e}function qs(s,e,t,n){return tp(s,e)+np(s,t)+ip(s,n)}function sp(s,e){let t=1-s;return t*t*t*e}function rp(s,e){let t=1-s;return 3*t*t*s*e}function op(s,e){return 3*(1-s)*s*s*e}function ap(s,e){return s*s*s*e}function Xs(s,e,t,n,i){return sp(s,e)+rp(s,t)+op(s,n)+ap(s,i)}var Mo=class extends an{constructor(e=new Ee,t=new Ee,n=new Ee,i=new Ee){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new Ee){let n=t,i=this.v0,r=this.v1,o=this.v2,l=this.v3;return n.set(Xs(e,i.x,r.x,o.x,l.x),Xs(e,i.y,r.y,o.y,l.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},So=class extends an{constructor(e=new F,t=new F,n=new F,i=new F){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new F){let n=t,i=this.v0,r=this.v1,o=this.v2,l=this.v3;return n.set(Xs(e,i.x,r.x,o.x,l.x),Xs(e,i.y,r.y,o.y,l.y),Xs(e,i.z,r.z,o.z,l.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ao=class extends an{constructor(e=new Ee,t=new Ee){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Ee){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Ee){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},To=class extends an{constructor(e=new F,t=new F){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new F){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new F){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Eo=class extends an{constructor(e=new Ee,t=new Ee,n=new Ee){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new Ee){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(qs(e,i.x,r.x,o.x),qs(e,i.y,r.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},hr=class extends an{constructor(e=new F,t=new F,n=new F){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new F){let n=t,i=this.v0,r=this.v1,o=this.v2;return n.set(qs(e,i.x,r.x,o.x),qs(e,i.y,r.y,o.y),qs(e,i.z,r.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Co=class extends an{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Ee){let n=t,i=this.points,r=(i.length-1)*e,o=Math.floor(r),l=r-o,h=i[o===0?o:o-1],u=i[o],a=i[o>i.length-2?i.length-1:o+1],c=i[o>i.length-3?i.length-1:o+2];return n.set(Yh(l,h.x,u.x,a.x,c.x),Yh(l,h.y,u.y,a.y,c.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new Ee().fromArray(i))}return this}},lp=Object.freeze({__proto__:null,ArcCurve:wo,CatmullRomCurve3:gs,CubicBezierCurve:Mo,CubicBezierCurve3:So,EllipseCurve:cr,LineCurve:Ao,LineCurve3:To,QuadraticBezierCurve:Eo,QuadraticBezierCurve3:hr,SplineCurve:Co});var Xn=class s extends Dt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,o=t/2,l=Math.floor(n),h=Math.floor(i),u=l+1,a=h+1,c=e/l,d=t/h,f=[],m=[],x=[],p=[];for(let g=0;g<a;g++){let _=g*d-o;for(let y=0;y<u;y++){let v=y*c-r;m.push(v,-_,0),x.push(0,0,1),p.push(y/l),p.push(1-g/h)}}for(let g=0;g<h;g++)for(let _=0;_<l;_++){let y=_+u*g,v=_+u*(g+1),T=_+1+u*(g+1),A=_+1+u*g;f.push(y,v,A),f.push(v,T,A)}this.setIndex(f),this.setAttribute("position",new nt(m,3)),this.setAttribute("normal",new nt(x,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}},Ii=class s extends Dt{constructor(e=.5,t=1,n=32,i=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);let l=[],h=[],u=[],a=[],c=e,d=(t-e)/i,f=new F,m=new Ee;for(let x=0;x<=i;x++){for(let p=0;p<=n;p++){let g=r+p/n*o;f.x=c*Math.cos(g),f.y=c*Math.sin(g),h.push(f.x,f.y,f.z),u.push(0,0,1),m.x=(f.x/t+1)/2,m.y=(f.y/t+1)/2,a.push(m.x,m.y)}c+=d}for(let x=0;x<i;x++){let p=x*(n+1);for(let g=0;g<n;g++){let _=g+p,y=_,v=_+n+1,T=_+n+2,A=_+1;l.push(y,v,A),l.push(v,T,A)}}this.setIndex(l),this.setAttribute("position",new nt(h,3)),this.setAttribute("normal",new nt(u,3)),this.setAttribute("uv",new nt(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Pi=class s extends Dt{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,o=0,l=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:o,thetaLength:l},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let h=Math.min(o+l,Math.PI),u=0,a=[],c=new F,d=new F,f=[],m=[],x=[],p=[];for(let g=0;g<=n;g++){let _=[],y=g/n,v=0;g===0&&o===0?v=.5/t:g===n&&h===Math.PI&&(v=-.5/t);for(let T=0;T<=t;T++){let A=T/t;c.x=-e*Math.cos(i+A*r)*Math.sin(o+y*l),c.y=e*Math.cos(o+y*l),c.z=e*Math.sin(i+A*r)*Math.sin(o+y*l),m.push(c.x,c.y,c.z),d.copy(c).normalize(),x.push(d.x,d.y,d.z),p.push(A+v,1-y),_.push(u++)}a.push(_)}for(let g=0;g<n;g++)for(let _=0;_<t;_++){let y=a[g][_+1],v=a[g][_],T=a[g+1][_],A=a[g+1][_+1];(g!==0||o>0)&&f.push(y,v,A),(g!==n-1||h<Math.PI)&&f.push(v,T,A)}this.setIndex(f),this.setAttribute("position",new nt(m,3)),this.setAttribute("normal",new nt(x,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},ur=class s extends bo{constructor(e=1,t=0){let n=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],i=[2,1,0,0,3,2,1,3,0,2,3,1];super(n,i,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}},dr=class s extends Dt{constructor(e=1,t=.4,n=12,i=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);let o=[],l=[],h=[],u=[],a=new F,c=new F,d=new F;for(let f=0;f<=n;f++)for(let m=0;m<=i;m++){let x=m/i*r,p=f/n*Math.PI*2;c.x=(e+t*Math.cos(p))*Math.cos(x),c.y=(e+t*Math.cos(p))*Math.sin(x),c.z=t*Math.sin(p),l.push(c.x,c.y,c.z),a.x=e*Math.cos(x),a.y=e*Math.sin(x),d.subVectors(c,a).normalize(),h.push(d.x,d.y,d.z),u.push(m/i),u.push(f/n)}for(let f=1;f<=n;f++)for(let m=1;m<=i;m++){let x=(i+1)*f+m-1,p=(i+1)*(f-1)+m-1,g=(i+1)*(f-1)+m,_=(i+1)*f+m;o.push(x,p,_),o.push(p,g,_)}this.setIndex(o),this.setAttribute("position",new nt(l,3)),this.setAttribute("normal",new nt(h,3)),this.setAttribute("uv",new nt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var fr=class s extends Dt{constructor(e=new hr(new F(-1,-1,0),new F(-1,1,0),new F(1,1,0)),t=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let l=new F,h=new F,u=new Ee,a=new F,c=[],d=[],f=[],m=[];x(),this.setIndex(m),this.setAttribute("position",new nt(c,3)),this.setAttribute("normal",new nt(d,3)),this.setAttribute("uv",new nt(f,2));function x(){for(let y=0;y<t;y++)p(y);p(r===!1?t:0),_(),g()}function p(y){a=e.getPointAt(y/t,a);let v=o.normals[y],T=o.binormals[y];for(let A=0;A<=i;A++){let C=A/i*Math.PI*2,R=Math.sin(C),M=-Math.cos(C);h.x=M*v.x+R*T.x,h.y=M*v.y+R*T.y,h.z=M*v.z+R*T.z,h.normalize(),d.push(h.x,h.y,h.z),l.x=a.x+n*h.x,l.y=a.y+n*h.y,l.z=a.z+n*h.z,c.push(l.x,l.y,l.z)}}function g(){for(let y=1;y<=t;y++)for(let v=1;v<=i;v++){let T=(i+1)*(y-1)+(v-1),A=(i+1)*y+(v-1),C=(i+1)*y+v,R=(i+1)*(y-1)+v;m.push(T,A,R),m.push(A,C,R)}}function _(){for(let y=0;y<=t;y++)for(let v=0;v<=i;v++)u.x=y/t,u.y=v/i,f.push(u.x,u.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new s(new lp[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Li=class extends hi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new He(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new He(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=uc,this.normalScale=new Ee(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _n,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ro=class extends hi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Au,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Io=class extends hi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function oo(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function cp(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}var Ni=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<i)){for(let l=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===l)break;if(r=i,i=t[++n],e<i)break e}o=t.length;break t}if(!(e>=r)){let l=t[1];e<l&&(n=2,r=l);for(let h=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===h)break;if(i=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let l=n+o>>>1;e<t[l]?o=l:n=l+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let o=0;o!==i;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Po=class extends Ni{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Gl,endingEnd:Gl}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,o=e+1,l=i[r],h=i[o];if(l===void 0)switch(this.getSettings_().endingStart){case Wl:r=e,l=2*t-n;break;case ql:r=i.length-2,l=t+i[r]-i[r+1];break;default:r=e,l=n}if(h===void 0)switch(this.getSettings_().endingEnd){case Wl:o=e,h=2*n-t;break;case ql:o=1,h=n+i[1]-i[0];break;default:o=e-1,h=t}let u=(n-t)*.5,a=this.valueSize;this._weightPrev=u/(t-l),this._weightNext=u/(h-n),this._offsetPrev=r*a,this._offsetNext=o*a}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,l=this.valueSize,h=e*l,u=h-l,a=this._offsetPrev,c=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(n-t)/(i-t),x=m*m,p=x*m,g=-d*p+2*d*x-d*m,_=(1+d)*p+(-1.5-2*d)*x+(-.5+d)*m+1,y=(-1-f)*p+(1.5+f)*x+.5*m,v=f*p-f*x;for(let T=0;T!==l;++T)r[T]=g*o[a+T]+_*o[u+T]+y*o[h+T]+v*o[c+T];return r}},Lo=class extends Ni{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,l=this.valueSize,h=e*l,u=h-l,a=(n-t)/(i-t),c=1-a;for(let d=0;d!==l;++d)r[d]=o[u+d]*c+o[h+d]*a;return r}},No=class extends Ni{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},en=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=oo(t,this.TimeBufferType),this.values=oo(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:oo(e.times,Array),values:oo(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new No(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Po(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ys:t=this.InterpolantFactoryMethodDiscrete;break;case fo:t=this.InterpolantFactoryMethodLinear;break;case ao:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ys;case this.InterpolantFactoryMethodLinear:return fo;case this.InterpolantFactoryMethodSmooth:return ao}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,o=i-1;for(;r!==i&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==i){r>=o&&(o=Math.max(o,1),r=o-1);let l=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*l,o*l)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let l=0;l!==r;l++){let h=n[l];if(typeof h=="number"&&isNaN(h)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,l,h),e=!1;break}if(o!==null&&o>h){console.error("THREE.KeyframeTrack: Out of order keys.",this,l,h,o),e=!1;break}o=h}if(i!==void 0&&cp(i))for(let l=0,h=i.length;l!==h;++l){let u=i[l];if(isNaN(u)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,l,u),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===ao,r=e.length-1,o=1;for(let l=1;l<r;++l){let h=!1,u=e[l],a=e[l+1];if(u!==a&&(l!==1||u!==e[0]))if(i)h=!0;else{let c=l*n,d=c-n,f=c+n;for(let m=0;m!==n;++m){let x=t[c+m];if(x!==t[d+m]||x!==t[f+m]){h=!0;break}}}if(h){if(l!==o){e[o]=e[l];let c=l*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[c+f]}++o}}if(r>0){e[o]=e[r];for(let l=r*n,h=o*n,u=0;u!==n;++u)t[h+u]=t[l+u];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};en.prototype.ValueTypeName="";en.prototype.TimeBufferType=Float32Array;en.prototype.ValueBufferType=Float32Array;en.prototype.DefaultInterpolation=fo;var ui=class extends en{constructor(e,t,n){super(e,t,n)}};ui.prototype.ValueTypeName="bool";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=Ys;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var Do=class extends en{constructor(e,t,n,i){super(e,t,n,i)}};Do.prototype.ValueTypeName="color";var Fo=class extends en{constructor(e,t,n,i){super(e,t,n,i)}};Fo.prototype.ValueTypeName="number";var Bo=class extends Ni{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,o=this.sampleValues,l=this.valueSize,h=(n-t)/(i-t),u=e*l;for(let a=u+l;u!==a;u+=4)qn.slerpFlat(r,0,o,u-l,o,u,h);return r}},pr=class extends en{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new Bo(this.times,this.values,this.getValueSize(),e)}};pr.prototype.ValueTypeName="quaternion";pr.prototype.InterpolantFactoryMethodSmooth=void 0;var di=class extends en{constructor(e,t,n){super(e,t,n)}};di.prototype.ValueTypeName="string";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=Ys;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var Uo=class extends en{constructor(e,t,n,i){super(e,t,n,i)}};Uo.prototype.ValueTypeName="vector";var zo=class{constructor(e,t,n){let i=this,r=!1,o=0,l=0,h,u=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(a){l++,r===!1&&i.onStart!==void 0&&i.onStart(a,o,l),r=!0},this.itemEnd=function(a){o++,i.onProgress!==void 0&&i.onProgress(a,o,l),o===l&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(a){i.onError!==void 0&&i.onError(a)},this.resolveURL=function(a){return h?h(a):a},this.setURLModifier=function(a){return h=a,this},this.addHandler=function(a,c){return u.push(a,c),this},this.removeHandler=function(a){let c=u.indexOf(a);return c!==-1&&u.splice(c,2),this},this.getHandler=function(a){for(let c=0,d=u.length;c<d;c+=2){let f=u[c],m=u[c+1];if(f.global&&(f.lastIndex=0),f.test(a))return m}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Ou=new zo,Oo=class{constructor(e){this.manager=e!==void 0?e:Ou,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Oo.DEFAULT_MATERIAL_NAME="__DEFAULT";var mr=class extends Et{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new He(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},gr=class extends mr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.groundColor=new He(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Hl=new rt,$h=new F,Zh=new F,$l=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ee(512,512),this.mapType=bn,this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ps,this._frameExtents=new Ee(1,1),this._viewportCount=1,this._viewports=[new xt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;$h.setFromMatrixPosition(e.matrixWorld),t.position.copy($h),Zh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Zh),t.updateMatrixWorld(),Hl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Hl,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Hl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Di=class extends tr{constructor(e=-1,t=1,n=1,i=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,o=n+e,l=i+t,h=i-t;if(this.view!==null&&this.view.enabled){let u=(this.right-this.left)/this.view.fullWidth/this.zoom,a=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=u*this.view.offsetX,o=r+u*this.view.width,l-=a*this.view.offsetY,h=l-a*this.view.height}this.projectionMatrix.makeOrthographic(r,o,l,h,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Zl=class extends $l{constructor(){super(new Di(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},xr=class extends mr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.target=new Et,this.shadow=new Zl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var ko=class extends Xt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var yc="\\[\\]\\.:\\/",hp=new RegExp("["+yc+"]","g"),bc="[^"+yc+"]",up="[^"+yc.replace("\\.","")+"]",dp=/((?:WC+[\/:])*)/.source.replace("WC",bc),fp=/(WCOD+)?/.source.replace("WCOD",up),pp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",bc),mp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",bc),gp=new RegExp("^"+dp+fp+pp+mp+"$"),xp=["material","materials","bones","map"],jl=class{constructor(e,t,n){let i=n||lt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},lt=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(hp,"")}static parseTrackName(e){let t=gp.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);xp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let l=r[o];if(l.name===t||l.uuid===t)return l;let h=n(l.children);if(h)return h}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let u=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let a=0;a<e.length;a++)if(e[a].name===u){u=a;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(u!==void 0){if(e[u]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[u]}}let o=e[i];if(o===void 0){let u=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+u+"."+i+" but it wasn't found.",e);return}let l=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?l=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let h=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}h=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(h=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(h=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[h],this.setValue=this.SetterByBindingTypeAndVersioning[h][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};lt.Composite=jl;lt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};lt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};lt.prototype.GetterByBindingType=[lt.prototype._getValue_direct,lt.prototype._getValue_array,lt.prototype._getValue_arrayElement,lt.prototype._getValue_toArray];lt.prototype.SetterByBindingTypeAndVersioning=[[lt.prototype._setValue_direct,lt.prototype._setValue_direct_setNeedsUpdate,lt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_array,lt.prototype._setValue_array_setNeedsUpdate,lt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_arrayElement,lt.prototype._setValue_arrayElement_setNeedsUpdate,lt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_fromArray,lt.prototype._setValue_fromArray_setNeedsUpdate,lt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var By=new Float32Array(1);function wc(s,e,t,n){let i=_p(n);switch(t){case lc:return s*e;case na:return s*e/i.components*i.byteLength;case ia:return s*e/i.components*i.byteLength;case hc:return s*e*2/i.components*i.byteLength;case sa:return s*e*2/i.components*i.byteLength;case cc:return s*e*3/i.components*i.byteLength;case ln:return s*e*4/i.components*i.byteLength;case ra:return s*e*4/i.components*i.byteLength;case yr:case br:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case wr:case Mr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case aa:case ca:return Math.max(s,16)*Math.max(e,8)/4;case oa:case la:return Math.max(s,8)*Math.max(e,8)/2;case ha:case ua:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case da:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case fa:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case pa:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case ma:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case ga:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case xa:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case _a:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case va:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case ya:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case ba:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case wa:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case Ma:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case Sa:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case Aa:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case Ta:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case Ea:case Ca:case Ra:return Math.ceil(s/4)*Math.ceil(e/4)*16;case Ia:case Pa:return Math.ceil(s/4)*Math.ceil(e/4)*8;case La:case Na:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function _p(s){switch(s){case bn:case sc:return{byteLength:1,components:1};case xs:case rc:case _s:return{byteLength:2,components:1};case ea:case ta:return{byteLength:2,components:4};case pi:case Qo:case wn:return{byteLength:4,components:1};case oc:case ac:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function cd(){let s=null,e=!1,t=null,n=null;function i(r,o){t(r,o),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Ap(s){let e=new WeakMap;function t(l,h){let u=l.array,a=l.usage,c=u.byteLength,d=s.createBuffer();s.bindBuffer(h,d),s.bufferData(h,u,a),l.onUploadCallback();let f;if(u instanceof Float32Array)f=s.FLOAT;else if(typeof Float16Array<"u"&&u instanceof Float16Array)f=s.HALF_FLOAT;else if(u instanceof Uint16Array)l.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(u instanceof Int16Array)f=s.SHORT;else if(u instanceof Uint32Array)f=s.UNSIGNED_INT;else if(u instanceof Int32Array)f=s.INT;else if(u instanceof Int8Array)f=s.BYTE;else if(u instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:d,type:f,bytesPerElement:u.BYTES_PER_ELEMENT,version:l.version,size:c}}function n(l,h,u){let a=h.array,c=h.updateRanges;if(s.bindBuffer(u,l),c.length===0)s.bufferSubData(u,0,a);else{c.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<c.length;f++){let m=c[d],x=c[f];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++d,c[d]=x)}c.length=d+1;for(let f=0,m=c.length;f<m;f++){let x=c[f];s.bufferSubData(u,x.start*a.BYTES_PER_ELEMENT,a,x.start,x.count)}h.clearUpdateRanges()}h.onUploadCallback()}function i(l){return l.isInterleavedBufferAttribute&&(l=l.data),e.get(l)}function r(l){l.isInterleavedBufferAttribute&&(l=l.data);let h=e.get(l);h&&(s.deleteBuffer(h.buffer),e.delete(l))}function o(l,h){if(l.isInterleavedBufferAttribute&&(l=l.data),l.isGLBufferAttribute){let a=e.get(l);(!a||a.version<l.version)&&e.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}let u=e.get(l);if(u===void 0)e.set(l,t(l,h));else if(u.version<l.version){if(u.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(u.buffer,l,h),u.version=l.version}}return{get:i,remove:r,update:o}}var Tp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ep=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Cp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ip=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Pp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Lp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT )
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN )
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Np=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Dp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Fp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Bp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Up=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Op=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,kp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Vp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Hp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Gp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Wp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,qp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Xp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Yp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,$p=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Zp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,jp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Kp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Jp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Qp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,em=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,tm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,nm="gl_FragColor = linearToOutputTexel( gl_FragColor );",im=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,sm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,rm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif`,om=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,am=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,lm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,cm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,hm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,um=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,dm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,fm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,pm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,mm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,gm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,xm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,_m=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,vm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ym=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Mm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Sm=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Am=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Tm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Em=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Cm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Rm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Im=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Pm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Lm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Nm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Dm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Fm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Bm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Um=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,zm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Om=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,km=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Hm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Gm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Wm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,qm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Xm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ym=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,$m=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Zm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,jm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Km=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Jm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Qm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,eg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,tg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ng=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,ig=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,sg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,rg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,og=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ag=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;

		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,lg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,cg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,hg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ug=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,dg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,fg=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,pg=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,mg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,gg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,xg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,_g=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,vg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,yg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,bg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,wg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Mg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Sg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ag=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Tg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Eg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Cg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Rg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ig=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Lg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ng=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Dg=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Fg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Bg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ug=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,zg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Og=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,kg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gg=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Wg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Xg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Yg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$g=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,jg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,e0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,t0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,i0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,s0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ve={alphahash_fragment:Tp,alphahash_pars_fragment:Ep,alphamap_fragment:Cp,alphamap_pars_fragment:Rp,alphatest_fragment:Ip,alphatest_pars_fragment:Pp,aomap_fragment:Lp,aomap_pars_fragment:Np,batching_pars_vertex:Dp,batching_vertex:Fp,begin_vertex:Bp,beginnormal_vertex:Up,bsdfs:zp,iridescence_fragment:Op,bumpmap_pars_fragment:kp,clipping_planes_fragment:Vp,clipping_planes_pars_fragment:Hp,clipping_planes_pars_vertex:Gp,clipping_planes_vertex:Wp,color_fragment:qp,color_pars_fragment:Xp,color_pars_vertex:Yp,color_vertex:$p,common:Zp,cube_uv_reflection_fragment:jp,defaultnormal_vertex:Kp,displacementmap_pars_vertex:Jp,displacementmap_vertex:Qp,emissivemap_fragment:em,emissivemap_pars_fragment:tm,colorspace_fragment:nm,colorspace_pars_fragment:im,envmap_fragment:sm,envmap_common_pars_fragment:rm,envmap_pars_fragment:om,envmap_pars_vertex:am,envmap_physical_pars_fragment:_m,envmap_vertex:lm,fog_vertex:cm,fog_pars_vertex:hm,fog_fragment:um,fog_pars_fragment:dm,gradientmap_pars_fragment:fm,lightmap_pars_fragment:pm,lights_lambert_fragment:mm,lights_lambert_pars_fragment:gm,lights_pars_begin:xm,lights_toon_fragment:vm,lights_toon_pars_fragment:ym,lights_phong_fragment:bm,lights_phong_pars_fragment:wm,lights_physical_fragment:Mm,lights_physical_pars_fragment:Sm,lights_fragment_begin:Am,lights_fragment_maps:Tm,lights_fragment_end:Em,logdepthbuf_fragment:Cm,logdepthbuf_pars_fragment:Rm,logdepthbuf_pars_vertex:Im,logdepthbuf_vertex:Pm,map_fragment:Lm,map_pars_fragment:Nm,map_particle_fragment:Dm,map_particle_pars_fragment:Fm,metalnessmap_fragment:Bm,metalnessmap_pars_fragment:Um,morphinstance_vertex:zm,morphcolor_vertex:Om,morphnormal_vertex:km,morphtarget_pars_vertex:Vm,morphtarget_vertex:Hm,normal_fragment_begin:Gm,normal_fragment_maps:Wm,normal_pars_fragment:qm,normal_pars_vertex:Xm,normal_vertex:Ym,normalmap_pars_fragment:$m,clearcoat_normal_fragment_begin:Zm,clearcoat_normal_fragment_maps:jm,clearcoat_pars_fragment:Km,iridescence_pars_fragment:Jm,opaque_fragment:Qm,packing:eg,premultiplied_alpha_fragment:tg,project_vertex:ng,dithering_fragment:ig,dithering_pars_fragment:sg,roughnessmap_fragment:rg,roughnessmap_pars_fragment:og,shadowmap_pars_fragment:ag,shadowmap_pars_vertex:lg,shadowmap_vertex:cg,shadowmask_pars_fragment:hg,skinbase_vertex:ug,skinning_pars_vertex:dg,skinning_vertex:fg,skinnormal_vertex:pg,specularmap_fragment:mg,specularmap_pars_fragment:gg,tonemapping_fragment:xg,tonemapping_pars_fragment:_g,transmission_fragment:vg,transmission_pars_fragment:yg,uv_pars_fragment:bg,uv_pars_vertex:wg,uv_vertex:Mg,worldpos_vertex:Sg,background_vert:Ag,background_frag:Tg,backgroundCube_vert:Eg,backgroundCube_frag:Cg,cube_vert:Rg,cube_frag:Ig,depth_vert:Pg,depth_frag:Lg,distanceRGBA_vert:Ng,distanceRGBA_frag:Dg,equirect_vert:Fg,equirect_frag:Bg,linedashed_vert:Ug,linedashed_frag:zg,meshbasic_vert:Og,meshbasic_frag:kg,meshlambert_vert:Vg,meshlambert_frag:Hg,meshmatcap_vert:Gg,meshmatcap_frag:Wg,meshnormal_vert:qg,meshnormal_frag:Xg,meshphong_vert:Yg,meshphong_frag:$g,meshphysical_vert:Zg,meshphysical_frag:jg,meshtoon_vert:Kg,meshtoon_frag:Jg,points_vert:Qg,points_frag:e0,shadow_vert:t0,shadow_frag:n0,sprite_vert:i0,sprite_frag:s0},ce={common:{diffuse:{value:new He(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ze}},envmap:{envMap:{value:null},envMapRotation:{value:new ze},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ze},normalScale:{value:new Ee(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new He(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new He(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0},uvTransform:{value:new ze}},sprite:{diffuse:{value:new He(16777215)},opacity:{value:1},center:{value:new Ee(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}}},Pn={basic:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new He(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:Bt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new He(0)},specular:{value:new He(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:Bt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new He(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:Bt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new He(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:Bt([ce.points,ce.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:Bt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:Bt([ce.common,ce.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:Bt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:Bt([ce.sprite,ce.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ze}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:Bt([ce.common,ce.displacementmap,{referencePosition:{value:new F},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:Bt([ce.lights,ce.fog,{color:{value:new He(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};Pn.physical={uniforms:Bt([Pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ze},clearcoatNormalScale:{value:new Ee(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ze},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ze},sheen:{value:0},sheenColor:{value:new He(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ze},transmissionSamplerSize:{value:new Ee},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ze},attenuationDistance:{value:0},attenuationColor:{value:new He(0)},specularColor:{value:new He(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ze},anisotropyVector:{value:new Ee},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ze}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};var Da={r:0,b:0,g:0},zi=new _n,r0=new rt;function o0(s,e,t,n,i,r,o){let l=new He(0),h=r===!0?0:1,u,a,c=null,d=0,f=null;function m(y){let v=y.isScene===!0?y.background:null;return v&&v.isTexture&&(v=(y.backgroundBlurriness>0?t:e).get(v)),v}function x(y){let v=!1,T=m(y);T===null?g(l,h):T&&T.isColor&&(g(T,1),v=!0);let A=s.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(s.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function p(y,v){let T=m(v);T&&(T.isCubeTexture||T.mapping===_r)?(a===void 0&&(a=new ht(new vn(1,1,1),new yn({name:"BackgroundCubeMaterial",uniforms:Ui(Pn.backgroundCube.uniforms),vertexShader:Pn.backgroundCube.vertexShader,fragmentShader:Pn.backgroundCube.fragmentShader,side:Gt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),a.geometry.deleteAttribute("normal"),a.geometry.deleteAttribute("uv"),a.onBeforeRender=function(A,C,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(a.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(a)),zi.copy(v.backgroundRotation),zi.x*=-1,zi.y*=-1,zi.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(zi.y*=-1,zi.z*=-1),a.material.uniforms.envMap.value=T,a.material.uniforms.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,a.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,a.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,a.material.uniforms.backgroundRotation.value.setFromMatrix4(r0.makeRotationFromEuler(zi)),a.material.toneMapped=je.getTransfer(T.colorSpace)!==tt,(c!==T||d!==T.version||f!==s.toneMapping)&&(a.material.needsUpdate=!0,c=T,d=T.version,f=s.toneMapping),a.layers.enableAll(),y.unshift(a,a.geometry,a.material,0,0,null)):T&&T.isTexture&&(u===void 0&&(u=new ht(new Xn(2,2),new yn({name:"BackgroundMaterial",uniforms:Ui(Pn.background.uniforms),vertexShader:Pn.background.vertexShader,fragmentShader:Pn.background.fragmentShader,side:Gn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(u)),u.material.uniforms.t2D.value=T,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.toneMapped=je.getTransfer(T.colorSpace)!==tt,T.matrixAutoUpdate===!0&&T.updateMatrix(),u.material.uniforms.uvTransform.value.copy(T.matrix),(c!==T||d!==T.version||f!==s.toneMapping)&&(u.material.needsUpdate=!0,c=T,d=T.version,f=s.toneMapping),u.layers.enableAll(),y.unshift(u,u.geometry,u.material,0,0,null))}function g(y,v){y.getRGB(Da,_c(s)),n.buffers.color.setClear(Da.r,Da.g,Da.b,v,o)}function _(){a!==void 0&&(a.geometry.dispose(),a.material.dispose(),a=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return l},setClearColor:function(y,v=1){l.set(y),h=v,g(l,h)},getClearAlpha:function(){return h},setClearAlpha:function(y){h=y,g(l,h)},render:x,addToRenderList:p,dispose:_}}function a0(s,e){let t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null),r=i,o=!1;function l(b,P,B,L,U){let O=!1,D=c(L,B,P);r!==D&&(r=D,u(r.object)),O=f(b,L,B,U),O&&m(b,L,B,U),U!==null&&e.update(U,s.ELEMENT_ARRAY_BUFFER),(O||o)&&(o=!1,v(b,P,B,L),U!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(U).buffer))}function h(){return s.createVertexArray()}function u(b){return s.bindVertexArray(b)}function a(b){return s.deleteVertexArray(b)}function c(b,P,B){let L=B.wireframe===!0,U=n[b.id];U===void 0&&(U={},n[b.id]=U);let O=U[P.id];O===void 0&&(O={},U[P.id]=O);let D=O[L];return D===void 0&&(D=d(h()),O[L]=D),D}function d(b){let P=[],B=[],L=[];for(let U=0;U<t;U++)P[U]=0,B[U]=0,L[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:B,attributeDivisors:L,object:b,attributes:{},index:null}}function f(b,P,B,L){let U=r.attributes,O=P.attributes,D=0,j=B.getAttributes();for(let H in j)if(j[H].location>=0){let ae=U[H],de=O[H];if(de===void 0&&(H==="instanceMatrix"&&b.instanceMatrix&&(de=b.instanceMatrix),H==="instanceColor"&&b.instanceColor&&(de=b.instanceColor)),ae===void 0||ae.attribute!==de||de&&ae.data!==de.data)return!0;D++}return r.attributesNum!==D||r.index!==L}function m(b,P,B,L){let U={},O=P.attributes,D=0,j=B.getAttributes();for(let H in j)if(j[H].location>=0){let ae=O[H];ae===void 0&&(H==="instanceMatrix"&&b.instanceMatrix&&(ae=b.instanceMatrix),H==="instanceColor"&&b.instanceColor&&(ae=b.instanceColor));let de={};de.attribute=ae,ae&&ae.data&&(de.data=ae.data),U[H]=de,D++}r.attributes=U,r.attributesNum=D,r.index=L}function x(){let b=r.newAttributes;for(let P=0,B=b.length;P<B;P++)b[P]=0}function p(b){g(b,0)}function g(b,P){let B=r.newAttributes,L=r.enabledAttributes,U=r.attributeDivisors;B[b]=1,L[b]===0&&(s.enableVertexAttribArray(b),L[b]=1),U[b]!==P&&(s.vertexAttribDivisor(b,P),U[b]=P)}function _(){let b=r.newAttributes,P=r.enabledAttributes;for(let B=0,L=P.length;B<L;B++)P[B]!==b[B]&&(s.disableVertexAttribArray(B),P[B]=0)}function y(b,P,B,L,U,O,D){D===!0?s.vertexAttribIPointer(b,P,B,U,O):s.vertexAttribPointer(b,P,B,L,U,O)}function v(b,P,B,L){x();let U=L.attributes,O=B.getAttributes(),D=P.defaultAttributeValues;for(let j in O){let H=O[j];if(H.location>=0){let Z=U[j];if(Z===void 0&&(j==="instanceMatrix"&&b.instanceMatrix&&(Z=b.instanceMatrix),j==="instanceColor"&&b.instanceColor&&(Z=b.instanceColor)),Z!==void 0){let ae=Z.normalized,de=Z.itemSize,re=e.get(Z);if(re===void 0)continue;let Ze=re.buffer,et=re.type,Ye=re.bytesPerElement,$=et===s.INT||et===s.UNSIGNED_INT||Z.gpuType===Qo;if(Z.isInterleavedBufferAttribute){let Q=Z.data,xe=Q.stride,De=Z.offset;if(Q.isInstancedInterleavedBuffer){for(let Te=0;Te<H.locationSize;Te++)g(H.location+Te,Q.meshPerAttribute);b.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Te=0;Te<H.locationSize;Te++)p(H.location+Te);s.bindBuffer(s.ARRAY_BUFFER,Ze);for(let Te=0;Te<H.locationSize;Te++)y(H.location+Te,de/H.locationSize,et,ae,xe*Ye,(De+de/H.locationSize*Te)*Ye,$)}else{if(Z.isInstancedBufferAttribute){for(let Q=0;Q<H.locationSize;Q++)g(H.location+Q,Z.meshPerAttribute);b.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let Q=0;Q<H.locationSize;Q++)p(H.location+Q);s.bindBuffer(s.ARRAY_BUFFER,Ze);for(let Q=0;Q<H.locationSize;Q++)y(H.location+Q,de/H.locationSize,et,ae,de*Ye,de/H.locationSize*Q*Ye,$)}}else if(D!==void 0){let ae=D[j];if(ae!==void 0)switch(ae.length){case 2:s.vertexAttrib2fv(H.location,ae);break;case 3:s.vertexAttrib3fv(H.location,ae);break;case 4:s.vertexAttrib4fv(H.location,ae);break;default:s.vertexAttrib1fv(H.location,ae)}}}}_()}function T(){R();for(let b in n){let P=n[b];for(let B in P){let L=P[B];for(let U in L)a(L[U].object),delete L[U];delete P[B]}delete n[b]}}function A(b){if(n[b.id]===void 0)return;let P=n[b.id];for(let B in P){let L=P[B];for(let U in L)a(L[U].object),delete L[U];delete P[B]}delete n[b.id]}function C(b){for(let P in n){let B=n[P];if(B[b.id]===void 0)continue;let L=B[b.id];for(let U in L)a(L[U].object),delete L[U];delete B[b.id]}}function R(){M(),o=!0,r!==i&&(r=i,u(r.object))}function M(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:l,reset:R,resetDefaultState:M,dispose:T,releaseStatesOfGeometry:A,releaseStatesOfProgram:C,initAttributes:x,enableAttribute:p,disableUnusedAttributes:_}}function l0(s,e,t){let n;function i(u){n=u}function r(u,a){s.drawArrays(n,u,a),t.update(a,n,1)}function o(u,a,c){c!==0&&(s.drawArraysInstanced(n,u,a,c),t.update(a,n,c))}function l(u,a,c){if(c===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,u,0,a,0,c);let f=0;for(let m=0;m<c;m++)f+=a[m];t.update(f,n,1)}function h(u,a,c,d){if(c===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<u.length;m++)o(u[m],a[m],d[m]);else{f.multiDrawArraysInstancedWEBGL(n,u,0,a,0,d,0,c);let m=0;for(let x=0;x<c;x++)m+=a[x]*d[x];t.update(m,n,1)}}this.setMode=i,this.render=r,this.renderInstances=o,this.renderMultiDraw=l,this.renderMultiDrawInstances=h}function c0(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(C){return!(C!==ln&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function l(C){let R=C===_s&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==bn&&n.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==wn&&!R)}function h(C){if(C==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let u=t.precision!==void 0?t.precision:"highp",a=h(u);a!==u&&(console.warn("THREE.WebGLRenderer:",u,"not supported, using",a,"instead."),u=a);let c=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),m=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),_=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),y=s.getParameter(s.MAX_VARYING_VECTORS),v=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),T=m>0,A=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:h,textureFormatReadable:o,textureTypeReadable:l,precision:u,logarithmicDepthBuffer:c,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:_,maxVaryings:y,maxFragmentUniforms:v,vertexTextures:T,maxSamples:A}}function h0(s){let e=this,t=null,n=0,i=!1,r=!1,o=new En,l=new ze,h={value:null,needsUpdate:!1};this.uniform=h,this.numPlanes=0,this.numIntersection=0,this.init=function(c,d){let f=c.length!==0||d||n!==0||i;return i=d,n=c.length,f},this.beginShadows=function(){r=!0,a(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(c,d){t=a(c,d,0)},this.setState=function(c,d,f){let m=c.clippingPlanes,x=c.clipIntersection,p=c.clipShadows,g=s.get(c);if(!i||m===null||m.length===0||r&&!p)r?a(null):u();else{let _=r?0:n,y=_*4,v=g.clippingState||null;h.value=v,v=a(m,d,y,f);for(let T=0;T!==y;++T)v[T]=t[T];g.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function u(){h.value!==t&&(h.value=t,h.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function a(c,d,f,m){let x=c!==null?c.length:0,p=null;if(x!==0){if(p=h.value,m!==!0||p===null){let g=f+x*4,_=d.matrixWorldInverse;l.getNormalMatrix(_),(p===null||p.length<g)&&(p=new Float32Array(g));for(let y=0,v=f;y!==x;++y,v+=4)o.copy(c[y]).applyMatrix4(_,l),o.normal.toArray(p,v),p[v+3]=o.constant}h.value=p,h.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function u0(s){let e=new WeakMap;function t(o,l){return l===jo?o.mapping=Fi:l===Ko&&(o.mapping=Bi),o}function n(o){if(o&&o.isTexture){let l=o.mapping;if(l===jo||l===Ko)if(e.has(o)){let h=e.get(o).texture;return t(h,o.mapping)}else{let h=o.image;if(h&&h.height>0){let u=new vo(h.height);return u.fromEquirectangularTexture(s,o),e.set(o,u),o.addEventListener("dispose",i),t(u.texture,o.mapping)}else return null}}return o}function i(o){let l=o.target;l.removeEventListener("dispose",i);let h=e.get(l);h!==void 0&&(e.delete(l),h.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var Ms=4,ku=[.125,.215,.35,.446,.526,.582],Vi=20,Mc=new Di,Vu=new He,Sc=null,Ac=0,Tc=0,Ec=!1,ki=(1+Math.sqrt(5))/2,ws=1/ki,Hu=[new F(-ki,ws,0),new F(ki,ws,0),new F(-ws,0,ki),new F(ws,0,ki),new F(0,ki,-ws),new F(0,ki,ws),new F(-1,1,-1),new F(1,1,-1),new F(-1,1,1),new F(1,1,1)],d0=new F,Ua=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100,r={}){let{size:o=256,position:l=d0}=r;Sc=this._renderer.getRenderTarget(),Ac=this._renderer.getActiveCubeFace(),Tc=this._renderer.getActiveMipmapLevel(),Ec=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let h=this._allocateTargets();return h.depthBuffer=!0,this._sceneToCubeUV(e,n,i,h,l),t>0&&this._blur(h,0,0,t),this._applyPMREM(h),this._cleanup(h),h}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=qu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Wu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Sc,Ac,Tc),this._renderer.xr.enabled=Ec,e.scissorTest=!1,Fa(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Fi||e.mapping===Bi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Sc=this._renderer.getRenderTarget(),Ac=this._renderer.getActiveCubeFace(),Tc=this._renderer.getActiveMipmapLevel(),Ec=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:xn,minFilter:xn,generateMipmaps:!1,type:_s,format:ln,colorSpace:Ri,depthBuffer:!1},i=Gu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Gu(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=f0(r)),this._blurMaterial=p0(r,e,t)}return i}_compileMaterial(e){let t=new ht(this._lodPlanes[0],e);this._renderer.compile(t,Mc)}_sceneToCubeUV(e,t,n,i,r){let h=new Xt(90,1,t,n),u=[1,-1,1,1,1,1],a=[1,1,1,-1,-1,-1],c=this._renderer,d=c.autoClear,f=c.toneMapping;c.getClearColor(Vu),c.toneMapping=$n,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(i),c.clearDepth(),c.setRenderTarget(null));let x=new Ht({name:"PMREM.Background",side:Gt,depthWrite:!1,depthTest:!1}),p=new ht(new vn,x),g=!1,_=e.background;_?_.isColor&&(x.color.copy(_),e.background=null,g=!0):(x.color.copy(Vu),g=!0);for(let y=0;y<6;y++){let v=y%3;v===0?(h.up.set(0,u[y],0),h.position.set(r.x,r.y,r.z),h.lookAt(r.x+a[y],r.y,r.z)):v===1?(h.up.set(0,0,u[y]),h.position.set(r.x,r.y,r.z),h.lookAt(r.x,r.y+a[y],r.z)):(h.up.set(0,u[y],0),h.position.set(r.x,r.y,r.z),h.lookAt(r.x,r.y,r.z+a[y]));let T=this._cubeSize;Fa(i,v*T,y>2?T:0,T,T),c.setRenderTarget(i),g&&c.render(p,h),c.render(e,h)}p.geometry.dispose(),p.material.dispose(),c.toneMapping=f,c.autoClear=d,e.background=_}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===Fi||e.mapping===Bi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=qu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Wu());let r=i?this._cubemapMaterial:this._equirectMaterial,o=new ht(this._lodPlanes[0],r),l=r.uniforms;l.envMap.value=e;let h=this._cubeSize;Fa(t,0,0,3*h,2*h),n.setRenderTarget(t),n.render(o,Mc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let r=1;r<i;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),l=Hu[(i-r-1)%Hu.length];this._blur(e,r-1,r,o,l)}t.autoClear=n}_blur(e,t,n,i,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",r),this._halfBlur(o,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,o,l){let h=this._renderer,u=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let a=3,c=new ht(this._lodPlanes[i],u),d=u.uniforms,f=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Vi-1),x=r/m,p=isFinite(r)?1+Math.floor(a*x):Vi;p>Vi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Vi}`);let g=[],_=0;for(let C=0;C<Vi;++C){let R=C/x,M=Math.exp(-R*R/2);g.push(M),C===0?_+=M:C<p&&(_+=2*M)}for(let C=0;C<g.length;C++)g[C]=g[C]/_;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=g,d.latitudinal.value=o==="latitudinal",l&&(d.poleAxis.value=l);let{_lodMax:y}=this;d.dTheta.value=m,d.mipInt.value=y-n;let v=this._sizeLods[i],T=3*v*(i>y-Ms?i-y+Ms:0),A=4*(this._cubeSize-v);Fa(t,T,A,3*v,2*v),h.setRenderTarget(t),h.render(c,Mc)}};function f0(s){let e=[],t=[],n=[],i=s,r=s-Ms+1+ku.length;for(let o=0;o<r;o++){let l=Math.pow(2,i);t.push(l);let h=1/l;o>s-Ms?h=ku[o-s+Ms-1]:o===0&&(h=0),n.push(h);let u=1/(l-2),a=-u,c=1+u,d=[a,a,c,a,c,c,a,a,c,c,a,c],f=6,m=6,x=3,p=2,g=1,_=new Float32Array(x*m*f),y=new Float32Array(p*m*f),v=new Float32Array(g*m*f);for(let A=0;A<f;A++){let C=A%3*2/3-1,R=A>2?0:-1,M=[C,R,0,C+2/3,R,0,C+2/3,R+1,0,C,R,0,C+2/3,R+1,0,C,R+1,0];_.set(M,x*m*A),y.set(d,p*m*A);let b=[A,A,A,A,A,A];v.set(b,g*m*A)}let T=new Dt;T.setAttribute("position",new Nt(_,x)),T.setAttribute("uv",new Nt(y,p)),T.setAttribute("faceIndex",new Nt(v,g)),e.push(T),i>Ms&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Gu(s,e,t){let n=new Cn(s,e,t);return n.texture.mapping=_r,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Fa(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function p0(s,e,t){let n=new Float32Array(Vi),i=new F(0,1,0);return new yn({name:"SphericalGaussianBlur",defines:{n:Vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Wu(){return new yn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function qu(){return new yn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Yn,depthTest:!1,depthWrite:!1})}function Uc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function m0(s){let e=new WeakMap,t=null;function n(l){if(l&&l.isTexture){let h=l.mapping,u=h===jo||h===Ko,a=h===Fi||h===Bi;if(u||a){let c=e.get(l),d=c!==void 0?c.texture.pmremVersion:0;if(l.isRenderTargetTexture&&l.pmremVersion!==d)return t===null&&(t=new Ua(s)),c=u?t.fromEquirectangular(l,c):t.fromCubemap(l,c),c.texture.pmremVersion=l.pmremVersion,e.set(l,c),c.texture;if(c!==void 0)return c.texture;{let f=l.image;return u&&f&&f.height>0||a&&f&&i(f)?(t===null&&(t=new Ua(s)),c=u?t.fromEquirectangular(l):t.fromCubemap(l),c.texture.pmremVersion=l.pmremVersion,e.set(l,c),l.addEventListener("dispose",r),c.texture):null}}}return l}function i(l){let h=0,u=6;for(let a=0;a<u;a++)l[a]!==void 0&&h++;return h===u}function r(l){let h=l.target;h.removeEventListener("dispose",r);let u=e.get(h);u!==void 0&&(e.delete(h),u.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function g0(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&hs("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function x0(s,e,t,n){let i={},r=new WeakMap;function o(c){let d=c.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete i[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function l(c,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function h(c){let d=c.attributes;for(let f in d)e.update(d[f],s.ARRAY_BUFFER)}function u(c){let d=[],f=c.index,m=c.attributes.position,x=0;if(f!==null){let _=f.array;x=f.version;for(let y=0,v=_.length;y<v;y+=3){let T=_[y+0],A=_[y+1],C=_[y+2];d.push(T,A,A,C,C,T)}}else if(m!==void 0){let _=m.array;x=m.version;for(let y=0,v=_.length/3-1;y<v;y+=3){let T=y+0,A=y+1,C=y+2;d.push(T,A,A,C,C,T)}}else return;let p=new(xc(d)?er:Qs)(d,1);p.version=x;let g=r.get(c);g&&e.remove(g),r.set(c,p)}function a(c){let d=r.get(c);if(d){let f=c.index;f!==null&&d.version<f.version&&u(c)}else u(c);return r.get(c)}return{get:l,update:h,getWireframeAttribute:a}}function _0(s,e,t){let n;function i(d){n=d}let r,o;function l(d){r=d.type,o=d.bytesPerElement}function h(d,f){s.drawElements(n,f,r,d*o),t.update(f,n,1)}function u(d,f,m){m!==0&&(s.drawElementsInstanced(n,f,r,d*o,m),t.update(f,n,m))}function a(d,f,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];t.update(p,n,1)}function c(d,f,m,x){if(m===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d.length;g++)u(d[g]/o,f[g],x[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,x,0,m);let g=0;for(let _=0;_<m;_++)g+=f[_]*x[_];t.update(g,n,1)}}this.setMode=i,this.setIndex=l,this.render=h,this.renderInstances=u,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function v0(s){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,l){switch(t.calls++,o){case s.TRIANGLES:t.triangles+=l*(r/3);break;case s.LINES:t.lines+=l*(r/2);break;case s.LINE_STRIP:t.lines+=l*(r-1);break;case s.LINE_LOOP:t.lines+=l*r;break;case s.POINTS:t.points+=l*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function y0(s,e,t){let n=new WeakMap,i=new xt;function r(o,l,h){let u=o.morphTargetInfluences,a=l.morphAttributes.position||l.morphAttributes.normal||l.morphAttributes.color,c=a!==void 0?a.length:0,d=n.get(l);if(d===void 0||d.count!==c){let M=function(){C.dispose(),n.delete(l),l.removeEventListener("dispose",M)};d!==void 0&&d.texture.dispose();let f=l.morphAttributes.position!==void 0,m=l.morphAttributes.normal!==void 0,x=l.morphAttributes.color!==void 0,p=l.morphAttributes.position||[],g=l.morphAttributes.normal||[],_=l.morphAttributes.color||[],y=0;f===!0&&(y=1),m===!0&&(y=2),x===!0&&(y=3);let v=l.attributes.position.count*y,T=1;v>e.maxTextureSize&&(T=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let A=new Float32Array(v*T*4*c),C=new Ks(A,v,T,c);C.type=wn,C.needsUpdate=!0;let R=y*4;for(let b=0;b<c;b++){let P=p[b],B=g[b],L=_[b],U=v*T*4*b;for(let O=0;O<P.count;O++){let D=O*R;f===!0&&(i.fromBufferAttribute(P,O),A[U+D+0]=i.x,A[U+D+1]=i.y,A[U+D+2]=i.z,A[U+D+3]=0),m===!0&&(i.fromBufferAttribute(B,O),A[U+D+4]=i.x,A[U+D+5]=i.y,A[U+D+6]=i.z,A[U+D+7]=0),x===!0&&(i.fromBufferAttribute(L,O),A[U+D+8]=i.x,A[U+D+9]=i.y,A[U+D+10]=i.z,A[U+D+11]=L.itemSize===4?i.w:1)}}d={count:c,texture:C,size:new Ee(v,T)},n.set(l,d),l.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)h.getUniforms().setValue(s,"morphTexture",o.morphTexture,t);else{let f=0;for(let x=0;x<u.length;x++)f+=u[x];let m=l.morphTargetsRelative?1:1-f;h.getUniforms().setValue(s,"morphTargetBaseInfluence",m),h.getUniforms().setValue(s,"morphTargetInfluences",u)}h.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),h.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function b0(s,e,t,n){let i=new WeakMap;function r(h){let u=n.render.frame,a=h.geometry,c=e.get(h,a);if(i.get(c)!==u&&(e.update(c),i.set(c,u)),h.isInstancedMesh&&(h.hasEventListener("dispose",l)===!1&&h.addEventListener("dispose",l),i.get(h)!==u&&(t.update(h.instanceMatrix,s.ARRAY_BUFFER),h.instanceColor!==null&&t.update(h.instanceColor,s.ARRAY_BUFFER),i.set(h,u))),h.isSkinnedMesh){let d=h.skeleton;i.get(d)!==u&&(d.update(),i.set(d,u))}return c}function o(){i=new WeakMap}function l(h){let u=h.target;u.removeEventListener("dispose",l),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:r,dispose:o}}var hd=new Vt,Xu=new or(1,1),ud=new Ks,dd=new go,fd=new nr,Yu=[],$u=[],Zu=new Float32Array(16),ju=new Float32Array(9),Ku=new Float32Array(4);function As(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=Yu[i];if(r===void 0&&(r=new Float32Array(i),Yu[i]=r),e!==0){n.toArray(r,0);for(let o=1,l=0;o!==e;++o)l+=t,s[o].toArray(r,l)}return r}function wt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Mt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Oa(s,e){let t=$u[e];t===void 0&&(t=new Int32Array(e),$u[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function w0(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function M0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;s.uniform2fv(this.addr,e),Mt(t,e)}}function S0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(wt(t,e))return;s.uniform3fv(this.addr,e),Mt(t,e)}}function A0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;s.uniform4fv(this.addr,e),Mt(t,e)}}function T0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;Ku.set(n),s.uniformMatrix2fv(this.addr,!1,Ku),Mt(t,n)}}function E0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;ju.set(n),s.uniformMatrix3fv(this.addr,!1,ju),Mt(t,n)}}function C0(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;Zu.set(n),s.uniformMatrix4fv(this.addr,!1,Zu),Mt(t,n)}}function R0(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function I0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;s.uniform2iv(this.addr,e),Mt(t,e)}}function P0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;s.uniform3iv(this.addr,e),Mt(t,e)}}function L0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;s.uniform4iv(this.addr,e),Mt(t,e)}}function N0(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function D0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;s.uniform2uiv(this.addr,e),Mt(t,e)}}function F0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;s.uniform3uiv(this.addr,e),Mt(t,e)}}function B0(s,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;s.uniform4uiv(this.addr,e),Mt(t,e)}}function U0(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Xu.compareFunction=dc,r=Xu):r=hd,t.setTexture2D(e||r,i)}function z0(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||dd,i)}function O0(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||fd,i)}function k0(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||ud,i)}function V0(s){switch(s){case 5126:return w0;case 35664:return M0;case 35665:return S0;case 35666:return A0;case 35674:return T0;case 35675:return E0;case 35676:return C0;case 5124:case 35670:return R0;case 35667:case 35671:return I0;case 35668:case 35672:return P0;case 35669:case 35673:return L0;case 5125:return N0;case 36294:return D0;case 36295:return F0;case 36296:return B0;case 35678:case 36198:case 36298:case 36306:case 35682:return U0;case 35679:case 36299:case 36307:return z0;case 35680:case 36300:case 36308:case 36293:return O0;case 36289:case 36303:case 36311:case 36292:return k0}}function H0(s,e){s.uniform1fv(this.addr,e)}function G0(s,e){let t=As(e,this.size,2);s.uniform2fv(this.addr,t)}function W0(s,e){let t=As(e,this.size,3);s.uniform3fv(this.addr,t)}function q0(s,e){let t=As(e,this.size,4);s.uniform4fv(this.addr,t)}function X0(s,e){let t=As(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function Y0(s,e){let t=As(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function $0(s,e){let t=As(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Z0(s,e){s.uniform1iv(this.addr,e)}function j0(s,e){s.uniform2iv(this.addr,e)}function K0(s,e){s.uniform3iv(this.addr,e)}function J0(s,e){s.uniform4iv(this.addr,e)}function Q0(s,e){s.uniform1uiv(this.addr,e)}function ex(s,e){s.uniform2uiv(this.addr,e)}function tx(s,e){s.uniform3uiv(this.addr,e)}function nx(s,e){s.uniform4uiv(this.addr,e)}function ix(s,e,t){let n=this.cache,i=e.length,r=Oa(t,i);wt(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||hd,r[o])}function sx(s,e,t){let n=this.cache,i=e.length,r=Oa(t,i);wt(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||dd,r[o])}function rx(s,e,t){let n=this.cache,i=e.length,r=Oa(t,i);wt(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||fd,r[o])}function ox(s,e,t){let n=this.cache,i=e.length,r=Oa(t,i);wt(n,r)||(s.uniform1iv(this.addr,r),Mt(n,r));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||ud,r[o])}function ax(s){switch(s){case 5126:return H0;case 35664:return G0;case 35665:return W0;case 35666:return q0;case 35674:return X0;case 35675:return Y0;case 35676:return $0;case 5124:case 35670:return Z0;case 35667:case 35671:return j0;case 35668:case 35672:return K0;case 35669:case 35673:return J0;case 5125:return Q0;case 36294:return ex;case 36295:return tx;case 36296:return nx;case 35678:case 36198:case 36298:case 36306:case 35682:return ix;case 35679:case 36299:case 36307:return sx;case 35680:case 36300:case 36308:case 36293:return rx;case 36289:case 36303:case 36311:case 36292:return ox}}var Rc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=V0(t.type)}},Ic=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=ax(t.type)}},Pc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,o=i.length;r!==o;++r){let l=i[r];l.setValue(e,t[l.id],n)}}},Cc=/(\w+)(\])?(\[|\.)?/g;function Ju(s,e){s.seq.push(e),s.map[e.id]=e}function lx(s,e,t){let n=s.name,i=n.length;for(Cc.lastIndex=0;;){let r=Cc.exec(n),o=Cc.lastIndex,l=r[1],h=r[2]==="]",u=r[3];if(h&&(l=l|0),u===void 0||u==="["&&o+2===i){Ju(t,u===void 0?new Rc(l,s,e):new Ic(l,s,e));break}else{let c=t.map[l];c===void 0&&(c=new Pc(l),Ju(t,c)),t=c}}}var Ss=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i),o=e.getUniformLocation(t,r.name);lx(r,o,this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,o=t.length;r!==o;++r){let l=t[r],h=n[l.id];h.needsUpdate!==!1&&l.setValue(e,h.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function Qu(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}var cx=37297,hx=0;function ux(s,e){let t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=i;o<r;o++){let l=o+1;n.push(`${l===e?">":" "} ${l}: ${t[o]}`)}return n.join(`
`)}var ed=new ze;function dx(s){je._getMatrix(ed,je.workingColorSpace,s);let e=`mat3( ${ed.elements.map(t=>t.toFixed(4))} )`;switch(je.getTransfer(s)){case $s:return[e,"LinearTransferOETF"];case tt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function td(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let l=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+ux(s.getShaderSource(e),l)}else return r}function fx(s,e){let t=dx(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function px(s,e){let t;switch(e){case _u:t="Linear";break;case vu:t="Reinhard";break;case yu:t="Cineon";break;case Zo:t="ACESFilmic";break;case wu:t="AgX";break;case Mu:t="Neutral";break;case bu:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ba=new F;function mx(){je.getLuminanceCoefficients(Ba);let s=Ba.x.toFixed(4),e=Ba.y.toFixed(4),t=Ba.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function gx(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Sr).join(`
`)}function xx(s){let e=[];for(let t in s){let n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function _x(s,e){let t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(e,i),o=r.name,l=1;r.type===s.FLOAT_MAT2&&(l=2),r.type===s.FLOAT_MAT3&&(l=3),r.type===s.FLOAT_MAT4&&(l=4),t[o]={type:r.type,location:s.getAttribLocation(e,o),locationSize:l}}return t}function Sr(s){return s!==""}function nd(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function id(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var vx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Lc(s){return s.replace(vx,bx)}var yx=new Map;function bx(s,e){let t=Ve[e];if(t===void 0){let n=yx.get(e);if(n!==void 0)t=Ve[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Lc(t)}var wx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sd(s){return s.replace(wx,Mx)}function Mx(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function rd(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Sx(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===Jl?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===Vo?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===In&&(e="SHADOWMAP_TYPE_VSM"),e}function Ax(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Fi:case Bi:e="ENVMAP_TYPE_CUBE";break;case _r:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Tx(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case Bi:e="ENVMAP_MODE_REFRACTION";break}return e}function Ex(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case nc:e="ENVMAP_BLENDING_MULTIPLY";break;case gu:e="ENVMAP_BLENDING_MIX";break;case xu:e="ENVMAP_BLENDING_ADD";break}return e}function Cx(s){let e=s.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Rx(s,e,t,n){let i=s.getContext(),r=t.defines,o=t.vertexShader,l=t.fragmentShader,h=Sx(t),u=Ax(t),a=Tx(t),c=Ex(t),d=Cx(t),f=gx(t),m=xx(r),x=i.createProgram(),p,g,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Sr).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Sr).join(`
`),g.length>0&&(g+=`
`)):(p=[rd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+a:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+h:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Sr).join(`
`),g=[rd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+a:"",t.envMap?"#define "+c:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+h:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==$n?"#define TONE_MAPPING":"",t.toneMapping!==$n?Ve.tonemapping_pars_fragment:"",t.toneMapping!==$n?px("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,fx("linearToOutputTexel",t.outputColorSpace),mx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Sr).join(`
`)),o=Lc(o),o=nd(o,t),o=id(o,t),l=Lc(l),l=nd(l,t),l=id(l,t),o=sd(o),l=sd(l),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",t.glslVersion===pc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===pc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let y=_+p+o,v=_+g+l,T=Qu(i,i.VERTEX_SHADER,y),A=Qu(i,i.FRAGMENT_SHADER,v);i.attachShader(x,T),i.attachShader(x,A),t.index0AttributeName!==void 0?i.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(x,0,"position"),i.linkProgram(x);function C(P){if(s.debug.checkShaderErrors){let B=i.getProgramInfoLog(x)||"",L=i.getShaderInfoLog(T)||"",U=i.getShaderInfoLog(A)||"",O=B.trim(),D=L.trim(),j=U.trim(),H=!0,Z=!0;if(i.getProgramParameter(x,i.LINK_STATUS)===!1)if(H=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,x,T,A);else{let ae=td(i,T,"vertex"),de=td(i,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(x,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+O+`
`+ae+`
`+de)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):(D===""||j==="")&&(Z=!1);Z&&(P.diagnostics={runnable:H,programLog:O,vertexShader:{log:D,prefix:p},fragmentShader:{log:j,prefix:g}})}i.deleteShader(T),i.deleteShader(A),R=new Ss(i,x),M=_x(i,x)}let R;this.getUniforms=function(){return R===void 0&&C(this),R};let M;this.getAttributes=function(){return M===void 0&&C(this),M};let b=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=i.getProgramParameter(x,cx)),b},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=hx++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=T,this.fragmentShader=A,this}var Ix=0,Nc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Dc(e),t.set(e,n)),n}},Dc=class{constructor(e){this.id=Ix++,this.code=e,this.usedTimes=0}};function Px(s,e,t,n,i,r,o){let l=new Js,h=new Nc,u=new Set,a=[],c=i.logarithmicDepthBuffer,d=i.vertexTextures,f=i.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return u.add(M),M===0?"uv":`uv${M}`}function p(M,b,P,B,L){let U=B.fog,O=L.geometry,D=M.isMeshStandardMaterial?B.environment:null,j=(M.isMeshStandardMaterial?t:e).get(M.envMap||D),H=j&&j.mapping===_r?j.image.height:null,Z=m[M.type];M.precision!==null&&(f=i.getMaxPrecision(M.precision),f!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));let ae=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,de=ae!==void 0?ae.length:0,re=0;O.morphAttributes.position!==void 0&&(re=1),O.morphAttributes.normal!==void 0&&(re=2),O.morphAttributes.color!==void 0&&(re=3);let Ze,et,Ye,$;if(Z){let Je=Pn[Z];Ze=Je.vertexShader,et=Je.fragmentShader}else Ze=M.vertexShader,et=M.fragmentShader,h.update(M),Ye=h.getVertexShaderID(M),$=h.getFragmentShaderID(M);let Q=s.getRenderTarget(),xe=s.state.buffers.depth.getReversed(),De=L.isInstancedMesh===!0,Te=L.isBatchedMesh===!0,$e=!!M.map,It=!!M.matcap,N=!!j,dt=!!M.aoMap,Ue=!!M.lightMap,Le=!!M.bumpMap,ye=!!M.normalMap,ft=!!M.displacementMap,be=!!M.emissiveMap,ke=!!M.metalnessMap,At=!!M.roughnessMap,vt=M.anisotropy>0,I=M.clearcoat>0,w=M.dispersion>0,G=M.iridescence>0,Y=M.sheen>0,ee=M.transmission>0,X=vt&&!!M.anisotropyMap,Ae=I&&!!M.clearcoatMap,oe=I&&!!M.clearcoatNormalMap,we=I&&!!M.clearcoatRoughnessMap,Me=G&&!!M.iridescenceMap,ie=G&&!!M.iridescenceThicknessMap,fe=Y&&!!M.sheenColorMap,Pe=Y&&!!M.sheenRoughnessMap,Se=!!M.specularMap,he=!!M.specularColorMap,Oe=!!M.specularIntensityMap,z=ee&&!!M.transmissionMap,se=ee&&!!M.thicknessMap,le=!!M.gradientMap,ge=!!M.alphaMap,te=M.alphaTest>0,K=!!M.alphaHash,ve=!!M.extensions,Be=$n;M.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Be=s.toneMapping);let ot={shaderID:Z,shaderType:M.type,shaderName:M.name,vertexShader:Ze,fragmentShader:et,defines:M.defines,customVertexShaderID:Ye,customFragmentShaderID:$,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:Te,batchingColor:Te&&L._colorsTexture!==null,instancing:De,instancingColor:De&&L.instanceColor!==null,instancingMorph:De&&L.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Q===null?s.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Ri,alphaToCoverage:!!M.alphaToCoverage,map:$e,matcap:It,envMap:N,envMapMode:N&&j.mapping,envMapCubeUVHeight:H,aoMap:dt,lightMap:Ue,bumpMap:Le,normalMap:ye,displacementMap:d&&ft,emissiveMap:be,normalMapObjectSpace:ye&&M.normalMapType===Eu,normalMapTangentSpace:ye&&M.normalMapType===uc,metalnessMap:ke,roughnessMap:At,anisotropy:vt,anisotropyMap:X,clearcoat:I,clearcoatMap:Ae,clearcoatNormalMap:oe,clearcoatRoughnessMap:we,dispersion:w,iridescence:G,iridescenceMap:Me,iridescenceThicknessMap:ie,sheen:Y,sheenColorMap:fe,sheenRoughnessMap:Pe,specularMap:Se,specularColorMap:he,specularIntensityMap:Oe,transmission:ee,transmissionMap:z,thicknessMap:se,gradientMap:le,opaque:M.transparent===!1&&M.blending===Ei&&M.alphaToCoverage===!1,alphaMap:ge,alphaTest:te,alphaHash:K,combine:M.combine,mapUv:$e&&x(M.map.channel),aoMapUv:dt&&x(M.aoMap.channel),lightMapUv:Ue&&x(M.lightMap.channel),bumpMapUv:Le&&x(M.bumpMap.channel),normalMapUv:ye&&x(M.normalMap.channel),displacementMapUv:ft&&x(M.displacementMap.channel),emissiveMapUv:be&&x(M.emissiveMap.channel),metalnessMapUv:ke&&x(M.metalnessMap.channel),roughnessMapUv:At&&x(M.roughnessMap.channel),anisotropyMapUv:X&&x(M.anisotropyMap.channel),clearcoatMapUv:Ae&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:oe&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:we&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Me&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:Pe&&x(M.sheenRoughnessMap.channel),specularMapUv:Se&&x(M.specularMap.channel),specularColorMapUv:he&&x(M.specularColorMap.channel),specularIntensityMapUv:Oe&&x(M.specularIntensityMap.channel),transmissionMapUv:z&&x(M.transmissionMap.channel),thicknessMapUv:se&&x(M.thicknessMap.channel),alphaMapUv:ge&&x(M.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(ye||vt),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!O.attributes.uv&&($e||ge),fog:!!U,useFog:M.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:M.flatShading===!0&&M.wireframe===!1,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:c,reversedDepthBuffer:xe,skinning:L.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:re,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:s.shadowMap.enabled&&P.length>0,shadowMapType:s.shadowMap.type,toneMapping:Be,decodeVideoTexture:$e&&M.map.isVideoTexture===!0&&je.getTransfer(M.map.colorSpace)===tt,decodeVideoTextureEmissive:be&&M.emissiveMap.isVideoTexture===!0&&je.getTransfer(M.emissiveMap.colorSpace)===tt,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Ft,flipSided:M.side===Gt,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:ve&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&M.extensions.multiDraw===!0||Te)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return ot.vertexUv1s=u.has(1),ot.vertexUv2s=u.has(2),ot.vertexUv3s=u.has(3),u.clear(),ot}function g(M){let b=[];if(M.shaderID?b.push(M.shaderID):(b.push(M.customVertexShaderID),b.push(M.customFragmentShaderID)),M.defines!==void 0)for(let P in M.defines)b.push(P),b.push(M.defines[P]);return M.isRawShaderMaterial===!1&&(_(b,M),y(b,M),b.push(s.outputColorSpace)),b.push(M.customProgramCacheKey),b.join()}function _(M,b){M.push(b.precision),M.push(b.outputColorSpace),M.push(b.envMapMode),M.push(b.envMapCubeUVHeight),M.push(b.mapUv),M.push(b.alphaMapUv),M.push(b.lightMapUv),M.push(b.aoMapUv),M.push(b.bumpMapUv),M.push(b.normalMapUv),M.push(b.displacementMapUv),M.push(b.emissiveMapUv),M.push(b.metalnessMapUv),M.push(b.roughnessMapUv),M.push(b.anisotropyMapUv),M.push(b.clearcoatMapUv),M.push(b.clearcoatNormalMapUv),M.push(b.clearcoatRoughnessMapUv),M.push(b.iridescenceMapUv),M.push(b.iridescenceThicknessMapUv),M.push(b.sheenColorMapUv),M.push(b.sheenRoughnessMapUv),M.push(b.specularMapUv),M.push(b.specularColorMapUv),M.push(b.specularIntensityMapUv),M.push(b.transmissionMapUv),M.push(b.thicknessMapUv),M.push(b.combine),M.push(b.fogExp2),M.push(b.sizeAttenuation),M.push(b.morphTargetsCount),M.push(b.morphAttributeCount),M.push(b.numDirLights),M.push(b.numPointLights),M.push(b.numSpotLights),M.push(b.numSpotLightMaps),M.push(b.numHemiLights),M.push(b.numRectAreaLights),M.push(b.numDirLightShadows),M.push(b.numPointLightShadows),M.push(b.numSpotLightShadows),M.push(b.numSpotLightShadowsWithMaps),M.push(b.numLightProbes),M.push(b.shadowMapType),M.push(b.toneMapping),M.push(b.numClippingPlanes),M.push(b.numClipIntersection),M.push(b.depthPacking)}function y(M,b){l.disableAll(),b.supportsVertexTextures&&l.enable(0),b.instancing&&l.enable(1),b.instancingColor&&l.enable(2),b.instancingMorph&&l.enable(3),b.matcap&&l.enable(4),b.envMap&&l.enable(5),b.normalMapObjectSpace&&l.enable(6),b.normalMapTangentSpace&&l.enable(7),b.clearcoat&&l.enable(8),b.iridescence&&l.enable(9),b.alphaTest&&l.enable(10),b.vertexColors&&l.enable(11),b.vertexAlphas&&l.enable(12),b.vertexUv1s&&l.enable(13),b.vertexUv2s&&l.enable(14),b.vertexUv3s&&l.enable(15),b.vertexTangents&&l.enable(16),b.anisotropy&&l.enable(17),b.alphaHash&&l.enable(18),b.batching&&l.enable(19),b.dispersion&&l.enable(20),b.batchingColor&&l.enable(21),b.gradientMap&&l.enable(22),M.push(l.mask),l.disableAll(),b.fog&&l.enable(0),b.useFog&&l.enable(1),b.flatShading&&l.enable(2),b.logarithmicDepthBuffer&&l.enable(3),b.reversedDepthBuffer&&l.enable(4),b.skinning&&l.enable(5),b.morphTargets&&l.enable(6),b.morphNormals&&l.enable(7),b.morphColors&&l.enable(8),b.premultipliedAlpha&&l.enable(9),b.shadowMapEnabled&&l.enable(10),b.doubleSided&&l.enable(11),b.flipSided&&l.enable(12),b.useDepthPacking&&l.enable(13),b.dithering&&l.enable(14),b.transmission&&l.enable(15),b.sheen&&l.enable(16),b.opaque&&l.enable(17),b.pointsUvs&&l.enable(18),b.decodeVideoTexture&&l.enable(19),b.decodeVideoTextureEmissive&&l.enable(20),b.alphaToCoverage&&l.enable(21),M.push(l.mask)}function v(M){let b=m[M.type],P;if(b){let B=Pn[b];P=zu.clone(B.uniforms)}else P=M.uniforms;return P}function T(M,b){let P;for(let B=0,L=a.length;B<L;B++){let U=a[B];if(U.cacheKey===b){P=U,++P.usedTimes;break}}return P===void 0&&(P=new Rx(s,b,M,r),a.push(P)),P}function A(M){if(--M.usedTimes===0){let b=a.indexOf(M);a[b]=a[a.length-1],a.pop(),M.destroy()}}function C(M){h.remove(M)}function R(){h.dispose()}return{getParameters:p,getProgramCacheKey:g,getUniforms:v,acquireProgram:T,releaseProgram:A,releaseShaderCache:C,programs:a,dispose:R}}function Lx(){let s=new WeakMap;function e(o){return s.has(o)}function t(o){let l=s.get(o);return l===void 0&&(l={},s.set(o,l)),l}function n(o){s.delete(o)}function i(o,l,h){s.get(o)[l]=h}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function Nx(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function od(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function ad(){let s=[],e=0,t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function o(c,d,f,m,x,p){let g=s[e];return g===void 0?(g={id:c.id,object:c,geometry:d,material:f,groupOrder:m,renderOrder:c.renderOrder,z:x,group:p},s[e]=g):(g.id=c.id,g.object=c,g.geometry=d,g.material=f,g.groupOrder=m,g.renderOrder=c.renderOrder,g.z=x,g.group=p),e++,g}function l(c,d,f,m,x,p){let g=o(c,d,f,m,x,p);f.transmission>0?n.push(g):f.transparent===!0?i.push(g):t.push(g)}function h(c,d,f,m,x,p){let g=o(c,d,f,m,x,p);f.transmission>0?n.unshift(g):f.transparent===!0?i.unshift(g):t.unshift(g)}function u(c,d){t.length>1&&t.sort(c||Nx),n.length>1&&n.sort(d||od),i.length>1&&i.sort(d||od)}function a(){for(let c=e,d=s.length;c<d;c++){let f=s[c];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:l,unshift:h,finish:a,sort:u}}function Dx(){let s=new WeakMap;function e(n,i){let r=s.get(n),o;return r===void 0?(o=new ad,s.set(n,[o])):i>=r.length?(o=new ad,r.push(o)):o=r[i],o}function t(){s=new WeakMap}return{get:e,dispose:t}}function Fx(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new F,color:new He};break;case"SpotLight":t={position:new F,direction:new F,color:new He,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new F,color:new He,distance:0,decay:0};break;case"HemisphereLight":t={direction:new F,skyColor:new He,groundColor:new He};break;case"RectAreaLight":t={color:new He,position:new F,halfWidth:new F,halfHeight:new F};break}return s[e.id]=t,t}}}function Bx(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}var Ux=0;function zx(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function Ox(s){let e=new Fx,t=Bx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)n.probe.push(new F);let i=new F,r=new rt,o=new rt;function l(u){let a=0,c=0,d=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let f=0,m=0,x=0,p=0,g=0,_=0,y=0,v=0,T=0,A=0,C=0;u.sort(zx);for(let M=0,b=u.length;M<b;M++){let P=u[M],B=P.color,L=P.intensity,U=P.distance,O=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)a+=B.r*L,c+=B.g*L,d+=B.b*L;else if(P.isLightProbe){for(let D=0;D<9;D++)n.probe[D].addScaledVector(P.sh.coefficients[D],L);C++}else if(P.isDirectionalLight){let D=e.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let j=P.shadow,H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,n.directionalShadow[f]=H,n.directionalShadowMap[f]=O,n.directionalShadowMatrix[f]=P.shadow.matrix,_++}n.directional[f]=D,f++}else if(P.isSpotLight){let D=e.get(P);D.position.setFromMatrixPosition(P.matrixWorld),D.color.copy(B).multiplyScalar(L),D.distance=U,D.coneCos=Math.cos(P.angle),D.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),D.decay=P.decay,n.spot[x]=D;let j=P.shadow;if(P.map&&(n.spotLightMap[T]=P.map,T++,j.updateMatrices(P),P.castShadow&&A++),n.spotLightMatrix[x]=j.matrix,P.castShadow){let H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,n.spotShadow[x]=H,n.spotShadowMap[x]=O,v++}x++}else if(P.isRectAreaLight){let D=e.get(P);D.color.copy(B).multiplyScalar(L),D.halfWidth.set(P.width*.5,0,0),D.halfHeight.set(0,P.height*.5,0),n.rectArea[p]=D,p++}else if(P.isPointLight){let D=e.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),D.distance=P.distance,D.decay=P.decay,P.castShadow){let j=P.shadow,H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,H.shadowCameraNear=j.camera.near,H.shadowCameraFar=j.camera.far,n.pointShadow[m]=H,n.pointShadowMap[m]=O,n.pointShadowMatrix[m]=P.shadow.matrix,y++}n.point[m]=D,m++}else if(P.isHemisphereLight){let D=e.get(P);D.skyColor.copy(P.color).multiplyScalar(L),D.groundColor.copy(P.groundColor).multiplyScalar(L),n.hemi[g]=D,g++}}p>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ce.LTC_FLOAT_1,n.rectAreaLTC2=ce.LTC_FLOAT_2):(n.rectAreaLTC1=ce.LTC_HALF_1,n.rectAreaLTC2=ce.LTC_HALF_2)),n.ambient[0]=a,n.ambient[1]=c,n.ambient[2]=d;let R=n.hash;(R.directionalLength!==f||R.pointLength!==m||R.spotLength!==x||R.rectAreaLength!==p||R.hemiLength!==g||R.numDirectionalShadows!==_||R.numPointShadows!==y||R.numSpotShadows!==v||R.numSpotMaps!==T||R.numLightProbes!==C)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=v+T-A,n.spotLightMap.length=T,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=C,R.directionalLength=f,R.pointLength=m,R.spotLength=x,R.rectAreaLength=p,R.hemiLength=g,R.numDirectionalShadows=_,R.numPointShadows=y,R.numSpotShadows=v,R.numSpotMaps=T,R.numLightProbes=C,n.version=Ux++)}function h(u,a){let c=0,d=0,f=0,m=0,x=0,p=a.matrixWorldInverse;for(let g=0,_=u.length;g<_;g++){let y=u[g];if(y.isDirectionalLight){let v=n.directional[c];v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),c++}else if(y.isSpotLight){let v=n.spot[f];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),f++}else if(y.isRectAreaLight){let v=n.rectArea[m];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),o.identity(),r.copy(y.matrixWorld),r.premultiply(p),o.extractRotation(r),v.halfWidth.set(y.width*.5,0,0),v.halfHeight.set(0,y.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),m++}else if(y.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),d++}else if(y.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(y.matrixWorld),v.direction.transformDirection(p),x++}}}return{setup:l,setupView:h,state:n}}function ld(s){let e=new Ox(s),t=[],n=[];function i(a){u.camera=a,t.length=0,n.length=0}function r(a){t.push(a)}function o(a){n.push(a)}function l(){e.setup(t)}function h(a){e.setupView(t,a)}let u={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:u,setupLights:l,setupLightsView:h,pushLight:r,pushShadow:o}}function kx(s){let e=new WeakMap;function t(i,r=0){let o=e.get(i),l;return o===void 0?(l=new ld(s),e.set(i,[l])):r>=o.length?(l=new ld(s),o.push(l)):l=o[r],l}function n(){e=new WeakMap}return{get:t,dispose:n}}var Vx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Hx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Gx(s,e,t){let n=new ps,i=new Ee,r=new Ee,o=new xt,l=new Ro({depthPacking:Tu}),h=new Io,u={},a=t.maxTextureSize,c={[Gn]:Gt,[Gt]:Gn,[Ft]:Ft},d=new yn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ee},radius:{value:4}},vertexShader:Vx,fragmentShader:Hx}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Dt;m.setAttribute("position",new Nt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ht(m,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Jl;let g=this.type;this.render=function(A,C,R){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;let M=s.getRenderTarget(),b=s.getActiveCubeFace(),P=s.getActiveMipmapLevel(),B=s.state;B.setBlending(Yn),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let L=g!==In&&this.type===In,U=g===In&&this.type!==In;for(let O=0,D=A.length;O<D;O++){let j=A[O],H=j.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",j,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;i.copy(H.mapSize);let Z=H.getFrameExtents();if(i.multiply(Z),r.copy(H.mapSize),(i.x>a||i.y>a)&&(i.x>a&&(r.x=Math.floor(a/Z.x),i.x=r.x*Z.x,H.mapSize.x=r.x),i.y>a&&(r.y=Math.floor(a/Z.y),i.y=r.y*Z.y,H.mapSize.y=r.y)),H.map===null||L===!0||U===!0){let de=this.type!==In?{minFilter:Yt,magFilter:Yt}:{};H.map!==null&&H.map.dispose(),H.map=new Cn(i.x,i.y,de),H.map.texture.name=j.name+".shadowMap",H.camera.updateProjectionMatrix()}s.setRenderTarget(H.map),s.clear();let ae=H.getViewportCount();for(let de=0;de<ae;de++){let re=H.getViewport(de);o.set(r.x*re.x,r.y*re.y,r.x*re.z,r.y*re.w),B.viewport(o),H.updateMatrices(j,de),n=H.getFrustum(),v(C,R,H.camera,j,this.type)}H.isPointLightShadow!==!0&&this.type===In&&_(H,R),H.needsUpdate=!1}g=this.type,p.needsUpdate=!1,s.setRenderTarget(M,b,P)};function _(A,C){let R=e.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Cn(i.x,i.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,s.setRenderTarget(A.mapPass),s.clear(),s.renderBufferDirect(C,null,R,d,x,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,s.setRenderTarget(A.map),s.clear(),s.renderBufferDirect(C,null,R,f,x,null)}function y(A,C,R,M){let b=null,P=R.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(P!==void 0)b=P;else if(b=R.isPointLight===!0?h:l,s.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let B=b.uuid,L=C.uuid,U=u[B];U===void 0&&(U={},u[B]=U);let O=U[L];O===void 0&&(O=b.clone(),U[L]=O,C.addEventListener("dispose",T)),b=O}if(b.visible=C.visible,b.wireframe=C.wireframe,M===In?b.side=C.shadowSide!==null?C.shadowSide:C.side:b.side=C.shadowSide!==null?C.shadowSide:c[C.side],b.alphaMap=C.alphaMap,b.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,b.map=C.map,b.clipShadows=C.clipShadows,b.clippingPlanes=C.clippingPlanes,b.clipIntersection=C.clipIntersection,b.displacementMap=C.displacementMap,b.displacementScale=C.displacementScale,b.displacementBias=C.displacementBias,b.wireframeLinewidth=C.wireframeLinewidth,b.linewidth=C.linewidth,R.isPointLight===!0&&b.isMeshDistanceMaterial===!0){let B=s.properties.get(b);B.light=R}return b}function v(A,C,R,M,b){if(A.visible===!1)return;if(A.layers.test(C.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&b===In)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,A.matrixWorld);let L=e.update(A),U=A.material;if(Array.isArray(U)){let O=L.groups;for(let D=0,j=O.length;D<j;D++){let H=O[D],Z=U[H.materialIndex];if(Z&&Z.visible){let ae=y(A,Z,M,b);A.onBeforeShadow(s,A,C,R,L,ae,H),s.renderBufferDirect(R,null,L,ae,A,H),A.onAfterShadow(s,A,C,R,L,ae,H)}}}else if(U.visible){let O=y(A,U,M,b);A.onBeforeShadow(s,A,C,R,L,O,null),s.renderBufferDirect(R,null,L,O,A,null),A.onAfterShadow(s,A,C,R,L,O,null)}}let B=A.children;for(let L=0,U=B.length;L<U;L++)v(B[L],C,R,M,b)}function T(A){A.target.removeEventListener("dispose",T);for(let R in u){let M=u[R],b=A.target.uuid;b in M&&(M[b].dispose(),delete M[b])}}}var Wx={[Ho]:Go,[Wo]:Yo,[qo]:$o,[Ci]:Xo,[Go]:Ho,[Yo]:Wo,[$o]:qo,[Xo]:Ci};function qx(s,e){function t(){let z=!1,se=new xt,le=null,ge=new xt(0,0,0,0);return{setMask:function(te){le!==te&&!z&&(s.colorMask(te,te,te,te),le=te)},setLocked:function(te){z=te},setClear:function(te,K,ve,Be,ot){ot===!0&&(te*=Be,K*=Be,ve*=Be),se.set(te,K,ve,Be),ge.equals(se)===!1&&(s.clearColor(te,K,ve,Be),ge.copy(se))},reset:function(){z=!1,le=null,ge.set(-1,0,0,0)}}}function n(){let z=!1,se=!1,le=null,ge=null,te=null;return{setReversed:function(K){if(se!==K){let ve=e.get("EXT_clip_control");K?ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.ZERO_TO_ONE_EXT):ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.NEGATIVE_ONE_TO_ONE_EXT),se=K;let Be=te;te=null,this.setClear(Be)}},getReversed:function(){return se},setTest:function(K){K?Q(s.DEPTH_TEST):xe(s.DEPTH_TEST)},setMask:function(K){le!==K&&!z&&(s.depthMask(K),le=K)},setFunc:function(K){if(se&&(K=Wx[K]),ge!==K){switch(K){case Ho:s.depthFunc(s.NEVER);break;case Go:s.depthFunc(s.ALWAYS);break;case Wo:s.depthFunc(s.LESS);break;case Ci:s.depthFunc(s.LEQUAL);break;case qo:s.depthFunc(s.EQUAL);break;case Xo:s.depthFunc(s.GEQUAL);break;case Yo:s.depthFunc(s.GREATER);break;case $o:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}ge=K}},setLocked:function(K){z=K},setClear:function(K){te!==K&&(se&&(K=1-K),s.clearDepth(K),te=K)},reset:function(){z=!1,le=null,ge=null,te=null,se=!1}}}function i(){let z=!1,se=null,le=null,ge=null,te=null,K=null,ve=null,Be=null,ot=null;return{setTest:function(Je){z||(Je?Q(s.STENCIL_TEST):xe(s.STENCIL_TEST))},setMask:function(Je){se!==Je&&!z&&(s.stencilMask(Je),se=Je)},setFunc:function(Je,Bn,Tn){(le!==Je||ge!==Bn||te!==Tn)&&(s.stencilFunc(Je,Bn,Tn),le=Je,ge=Bn,te=Tn)},setOp:function(Je,Bn,Tn){(K!==Je||ve!==Bn||Be!==Tn)&&(s.stencilOp(Je,Bn,Tn),K=Je,ve=Bn,Be=Tn)},setLocked:function(Je){z=Je},setClear:function(Je){ot!==Je&&(s.clearStencil(Je),ot=Je)},reset:function(){z=!1,se=null,le=null,ge=null,te=null,K=null,ve=null,Be=null,ot=null}}}let r=new t,o=new n,l=new i,h=new WeakMap,u=new WeakMap,a={},c={},d=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,y=null,v=null,T=null,A=null,C=new He(0,0,0),R=0,M=!1,b=null,P=null,B=null,L=null,U=null,O=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),D=!1,j=0,H=s.getParameter(s.VERSION);H.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(H)[1]),D=j>=1):H.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),D=j>=2);let Z=null,ae={},de=s.getParameter(s.SCISSOR_BOX),re=s.getParameter(s.VIEWPORT),Ze=new xt().fromArray(de),et=new xt().fromArray(re);function Ye(z,se,le,ge){let te=new Uint8Array(4),K=s.createTexture();s.bindTexture(z,K),s.texParameteri(z,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(z,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let ve=0;ve<le;ve++)z===s.TEXTURE_3D||z===s.TEXTURE_2D_ARRAY?s.texImage3D(se,0,s.RGBA,1,1,ge,0,s.RGBA,s.UNSIGNED_BYTE,te):s.texImage2D(se+ve,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,te);return K}let $={};$[s.TEXTURE_2D]=Ye(s.TEXTURE_2D,s.TEXTURE_2D,1),$[s.TEXTURE_CUBE_MAP]=Ye(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[s.TEXTURE_2D_ARRAY]=Ye(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),$[s.TEXTURE_3D]=Ye(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),l.setClear(0),Q(s.DEPTH_TEST),o.setFunc(Ci),Le(!1),ye(Kl),Q(s.CULL_FACE),dt(Yn);function Q(z){a[z]!==!0&&(s.enable(z),a[z]=!0)}function xe(z){a[z]!==!1&&(s.disable(z),a[z]=!1)}function De(z,se){return c[z]!==se?(s.bindFramebuffer(z,se),c[z]=se,z===s.DRAW_FRAMEBUFFER&&(c[s.FRAMEBUFFER]=se),z===s.FRAMEBUFFER&&(c[s.DRAW_FRAMEBUFFER]=se),!0):!1}function Te(z,se){let le=f,ge=!1;if(z){le=d.get(se),le===void 0&&(le=[],d.set(se,le));let te=z.textures;if(le.length!==te.length||le[0]!==s.COLOR_ATTACHMENT0){for(let K=0,ve=te.length;K<ve;K++)le[K]=s.COLOR_ATTACHMENT0+K;le.length=te.length,ge=!0}}else le[0]!==s.BACK&&(le[0]=s.BACK,ge=!0);ge&&s.drawBuffers(le)}function $e(z){return m!==z?(s.useProgram(z),m=z,!0):!1}let It={[li]:s.FUNC_ADD,[Qh]:s.FUNC_SUBTRACT,[eu]:s.FUNC_REVERSE_SUBTRACT};It[tu]=s.MIN,It[nu]=s.MAX;let N={[iu]:s.ZERO,[su]:s.ONE,[ru]:s.SRC_COLOR,[lo]:s.SRC_ALPHA,[uu]:s.SRC_ALPHA_SATURATE,[cu]:s.DST_COLOR,[au]:s.DST_ALPHA,[ou]:s.ONE_MINUS_SRC_COLOR,[co]:s.ONE_MINUS_SRC_ALPHA,[hu]:s.ONE_MINUS_DST_COLOR,[lu]:s.ONE_MINUS_DST_ALPHA,[du]:s.CONSTANT_COLOR,[fu]:s.ONE_MINUS_CONSTANT_COLOR,[pu]:s.CONSTANT_ALPHA,[mu]:s.ONE_MINUS_CONSTANT_ALPHA};function dt(z,se,le,ge,te,K,ve,Be,ot,Je){if(z===Yn){x===!0&&(xe(s.BLEND),x=!1);return}if(x===!1&&(Q(s.BLEND),x=!0),z!==Jh){if(z!==p||Je!==M){if((g!==li||v!==li)&&(s.blendEquation(s.FUNC_ADD),g=li,v=li),Je)switch(z){case Ei:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ql:s.blendFunc(s.ONE,s.ONE);break;case ec:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case tc:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case Ei:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ql:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case ec:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case tc:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}_=null,y=null,T=null,A=null,C.set(0,0,0),R=0,p=z,M=Je}return}te=te||se,K=K||le,ve=ve||ge,(se!==g||te!==v)&&(s.blendEquationSeparate(It[se],It[te]),g=se,v=te),(le!==_||ge!==y||K!==T||ve!==A)&&(s.blendFuncSeparate(N[le],N[ge],N[K],N[ve]),_=le,y=ge,T=K,A=ve),(Be.equals(C)===!1||ot!==R)&&(s.blendColor(Be.r,Be.g,Be.b,ot),C.copy(Be),R=ot),p=z,M=!1}function Ue(z,se){z.side===Ft?xe(s.CULL_FACE):Q(s.CULL_FACE);let le=z.side===Gt;se&&(le=!le),Le(le),z.blending===Ei&&z.transparent===!1?dt(Yn):dt(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),o.setFunc(z.depthFunc),o.setTest(z.depthTest),o.setMask(z.depthWrite),r.setMask(z.colorWrite);let ge=z.stencilWrite;l.setTest(ge),ge&&(l.setMask(z.stencilWriteMask),l.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),l.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),be(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?Q(s.SAMPLE_ALPHA_TO_COVERAGE):xe(s.SAMPLE_ALPHA_TO_COVERAGE)}function Le(z){b!==z&&(z?s.frontFace(s.CW):s.frontFace(s.CCW),b=z)}function ye(z){z!==jh?(Q(s.CULL_FACE),z!==P&&(z===Kl?s.cullFace(s.BACK):z===Kh?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):xe(s.CULL_FACE),P=z}function ft(z){z!==B&&(D&&s.lineWidth(z),B=z)}function be(z,se,le){z?(Q(s.POLYGON_OFFSET_FILL),(L!==se||U!==le)&&(s.polygonOffset(se,le),L=se,U=le)):xe(s.POLYGON_OFFSET_FILL)}function ke(z){z?Q(s.SCISSOR_TEST):xe(s.SCISSOR_TEST)}function At(z){z===void 0&&(z=s.TEXTURE0+O-1),Z!==z&&(s.activeTexture(z),Z=z)}function vt(z,se,le){le===void 0&&(Z===null?le=s.TEXTURE0+O-1:le=Z);let ge=ae[le];ge===void 0&&(ge={type:void 0,texture:void 0},ae[le]=ge),(ge.type!==z||ge.texture!==se)&&(Z!==le&&(s.activeTexture(le),Z=le),s.bindTexture(z,se||$[z]),ge.type=z,ge.texture=se)}function I(){let z=ae[Z];z!==void 0&&z.type!==void 0&&(s.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function w(){try{s.compressedTexImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function G(){try{s.compressedTexImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Y(){try{s.texSubImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ee(){try{s.texSubImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function X(){try{s.compressedTexSubImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ae(){try{s.compressedTexSubImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function oe(){try{s.texStorage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function we(){try{s.texStorage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Me(){try{s.texImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ie(){try{s.texImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function fe(z){Ze.equals(z)===!1&&(s.scissor(z.x,z.y,z.z,z.w),Ze.copy(z))}function Pe(z){et.equals(z)===!1&&(s.viewport(z.x,z.y,z.z,z.w),et.copy(z))}function Se(z,se){let le=u.get(se);le===void 0&&(le=new WeakMap,u.set(se,le));let ge=le.get(z);ge===void 0&&(ge=s.getUniformBlockIndex(se,z.name),le.set(z,ge))}function he(z,se){let ge=u.get(se).get(z);h.get(se)!==ge&&(s.uniformBlockBinding(se,ge,z.__bindingPointIndex),h.set(se,ge))}function Oe(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),o.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),a={},Z=null,ae={},c={},d=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,y=null,v=null,T=null,A=null,C=new He(0,0,0),R=0,M=!1,b=null,P=null,B=null,L=null,U=null,Ze.set(0,0,s.canvas.width,s.canvas.height),et.set(0,0,s.canvas.width,s.canvas.height),r.reset(),o.reset(),l.reset()}return{buffers:{color:r,depth:o,stencil:l},enable:Q,disable:xe,bindFramebuffer:De,drawBuffers:Te,useProgram:$e,setBlending:dt,setMaterial:Ue,setFlipSided:Le,setCullFace:ye,setLineWidth:ft,setPolygonOffset:be,setScissorTest:ke,activeTexture:At,bindTexture:vt,unbindTexture:I,compressedTexImage2D:w,compressedTexImage3D:G,texImage2D:Me,texImage3D:ie,updateUBOMapping:Se,uniformBlockBinding:he,texStorage2D:oe,texStorage3D:we,texSubImage2D:Y,texSubImage3D:ee,compressedTexSubImage2D:X,compressedTexSubImage3D:Ae,scissor:fe,viewport:Pe,reset:Oe}}function Xx(s,e,t,n,i,r,o){let l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,h=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new Ee,a=new WeakMap,c,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(I,w){return f?new OffscreenCanvas(I,w):js("canvas")}function x(I,w,G){let Y=1,ee=vt(I);if((ee.width>G||ee.height>G)&&(Y=G/Math.max(ee.width,ee.height)),Y<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let X=Math.floor(Y*ee.width),Ae=Math.floor(Y*ee.height);c===void 0&&(c=m(X,Ae));let oe=w?m(X,Ae):c;return oe.width=X,oe.height=Ae,oe.getContext("2d").drawImage(I,0,0,X,Ae),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+X+"x"+Ae+")."),oe}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),I;return I}function p(I){return I.generateMipmaps}function g(I){s.generateMipmap(I)}function _(I){return I.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?s.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function y(I,w,G,Y,ee=!1){if(I!==null){if(s[I]!==void 0)return s[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let X=w;if(w===s.RED&&(G===s.FLOAT&&(X=s.R32F),G===s.HALF_FLOAT&&(X=s.R16F),G===s.UNSIGNED_BYTE&&(X=s.R8)),w===s.RED_INTEGER&&(G===s.UNSIGNED_BYTE&&(X=s.R8UI),G===s.UNSIGNED_SHORT&&(X=s.R16UI),G===s.UNSIGNED_INT&&(X=s.R32UI),G===s.BYTE&&(X=s.R8I),G===s.SHORT&&(X=s.R16I),G===s.INT&&(X=s.R32I)),w===s.RG&&(G===s.FLOAT&&(X=s.RG32F),G===s.HALF_FLOAT&&(X=s.RG16F),G===s.UNSIGNED_BYTE&&(X=s.RG8)),w===s.RG_INTEGER&&(G===s.UNSIGNED_BYTE&&(X=s.RG8UI),G===s.UNSIGNED_SHORT&&(X=s.RG16UI),G===s.UNSIGNED_INT&&(X=s.RG32UI),G===s.BYTE&&(X=s.RG8I),G===s.SHORT&&(X=s.RG16I),G===s.INT&&(X=s.RG32I)),w===s.RGB_INTEGER&&(G===s.UNSIGNED_BYTE&&(X=s.RGB8UI),G===s.UNSIGNED_SHORT&&(X=s.RGB16UI),G===s.UNSIGNED_INT&&(X=s.RGB32UI),G===s.BYTE&&(X=s.RGB8I),G===s.SHORT&&(X=s.RGB16I),G===s.INT&&(X=s.RGB32I)),w===s.RGBA_INTEGER&&(G===s.UNSIGNED_BYTE&&(X=s.RGBA8UI),G===s.UNSIGNED_SHORT&&(X=s.RGBA16UI),G===s.UNSIGNED_INT&&(X=s.RGBA32UI),G===s.BYTE&&(X=s.RGBA8I),G===s.SHORT&&(X=s.RGBA16I),G===s.INT&&(X=s.RGBA32I)),w===s.RGB&&(G===s.UNSIGNED_INT_5_9_9_9_REV&&(X=s.RGB9_E5),G===s.UNSIGNED_INT_10F_11F_11F_REV&&(X=s.R11F_G11F_B10F)),w===s.RGBA){let Ae=ee?$s:je.getTransfer(Y);G===s.FLOAT&&(X=s.RGBA32F),G===s.HALF_FLOAT&&(X=s.RGBA16F),G===s.UNSIGNED_BYTE&&(X=Ae===tt?s.SRGB8_ALPHA8:s.RGBA8),G===s.UNSIGNED_SHORT_4_4_4_4&&(X=s.RGBA4),G===s.UNSIGNED_SHORT_5_5_5_1&&(X=s.RGB5_A1)}return(X===s.R16F||X===s.R32F||X===s.RG16F||X===s.RG32F||X===s.RGBA16F||X===s.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function v(I,w){let G;return I?w===null||w===pi||w===vs?G=s.DEPTH24_STENCIL8:w===wn?G=s.DEPTH32F_STENCIL8:w===xs&&(G=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===pi||w===vs?G=s.DEPTH_COMPONENT24:w===wn?G=s.DEPTH_COMPONENT32F:w===xs&&(G=s.DEPTH_COMPONENT16),G}function T(I,w){return p(I)===!0||I.isFramebufferTexture&&I.minFilter!==Yt&&I.minFilter!==xn?Math.log2(Math.max(w.width,w.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?w.mipmaps.length:1}function A(I){let w=I.target;w.removeEventListener("dispose",A),R(w),w.isVideoTexture&&a.delete(w)}function C(I){let w=I.target;w.removeEventListener("dispose",C),b(w)}function R(I){let w=n.get(I);if(w.__webglInit===void 0)return;let G=I.source,Y=d.get(G);if(Y){let ee=Y[w.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&M(I),Object.keys(Y).length===0&&d.delete(G)}n.remove(I)}function M(I){let w=n.get(I);s.deleteTexture(w.__webglTexture);let G=I.source,Y=d.get(G);delete Y[w.__cacheKey],o.memory.textures--}function b(I){let w=n.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),n.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(w.__webglFramebuffer[Y]))for(let ee=0;ee<w.__webglFramebuffer[Y].length;ee++)s.deleteFramebuffer(w.__webglFramebuffer[Y][ee]);else s.deleteFramebuffer(w.__webglFramebuffer[Y]);w.__webglDepthbuffer&&s.deleteRenderbuffer(w.__webglDepthbuffer[Y])}else{if(Array.isArray(w.__webglFramebuffer))for(let Y=0;Y<w.__webglFramebuffer.length;Y++)s.deleteFramebuffer(w.__webglFramebuffer[Y]);else s.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&s.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&s.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let Y=0;Y<w.__webglColorRenderbuffer.length;Y++)w.__webglColorRenderbuffer[Y]&&s.deleteRenderbuffer(w.__webglColorRenderbuffer[Y]);w.__webglDepthRenderbuffer&&s.deleteRenderbuffer(w.__webglDepthRenderbuffer)}let G=I.textures;for(let Y=0,ee=G.length;Y<ee;Y++){let X=n.get(G[Y]);X.__webglTexture&&(s.deleteTexture(X.__webglTexture),o.memory.textures--),n.remove(G[Y])}n.remove(I)}let P=0;function B(){P=0}function L(){let I=P;return I>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+i.maxTextures),P+=1,I}function U(I){let w=[];return w.push(I.wrapS),w.push(I.wrapT),w.push(I.wrapR||0),w.push(I.magFilter),w.push(I.minFilter),w.push(I.anisotropy),w.push(I.internalFormat),w.push(I.format),w.push(I.type),w.push(I.generateMipmaps),w.push(I.premultiplyAlpha),w.push(I.flipY),w.push(I.unpackAlignment),w.push(I.colorSpace),w.join()}function O(I,w){let G=n.get(I);if(I.isVideoTexture&&ke(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&G.__version!==I.version){let Y=I.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(G,I,w);return}}else I.isExternalTexture&&(G.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,G.__webglTexture,s.TEXTURE0+w)}function D(I,w){let G=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&G.__version!==I.version){$(G,I,w);return}t.bindTexture(s.TEXTURE_2D_ARRAY,G.__webglTexture,s.TEXTURE0+w)}function j(I,w){let G=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&G.__version!==I.version){$(G,I,w);return}t.bindTexture(s.TEXTURE_3D,G.__webglTexture,s.TEXTURE0+w)}function H(I,w){let G=n.get(I);if(I.version>0&&G.__version!==I.version){Q(G,I,w);return}t.bindTexture(s.TEXTURE_CUBE_MAP,G.__webglTexture,s.TEXTURE0+w)}let Z={[ho]:s.REPEAT,[ai]:s.CLAMP_TO_EDGE,[uo]:s.MIRRORED_REPEAT},ae={[Yt]:s.NEAREST,[Su]:s.NEAREST_MIPMAP_NEAREST,[vr]:s.NEAREST_MIPMAP_LINEAR,[xn]:s.LINEAR,[Jo]:s.LINEAR_MIPMAP_NEAREST,[fi]:s.LINEAR_MIPMAP_LINEAR},de={[Cu]:s.NEVER,[Du]:s.ALWAYS,[Ru]:s.LESS,[dc]:s.LEQUAL,[Iu]:s.EQUAL,[Nu]:s.GEQUAL,[Pu]:s.GREATER,[Lu]:s.NOTEQUAL};function re(I,w){if(w.type===wn&&e.has("OES_texture_float_linear")===!1&&(w.magFilter===xn||w.magFilter===Jo||w.magFilter===vr||w.magFilter===fi||w.minFilter===xn||w.minFilter===Jo||w.minFilter===vr||w.minFilter===fi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(I,s.TEXTURE_WRAP_S,Z[w.wrapS]),s.texParameteri(I,s.TEXTURE_WRAP_T,Z[w.wrapT]),(I===s.TEXTURE_3D||I===s.TEXTURE_2D_ARRAY)&&s.texParameteri(I,s.TEXTURE_WRAP_R,Z[w.wrapR]),s.texParameteri(I,s.TEXTURE_MAG_FILTER,ae[w.magFilter]),s.texParameteri(I,s.TEXTURE_MIN_FILTER,ae[w.minFilter]),w.compareFunction&&(s.texParameteri(I,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(I,s.TEXTURE_COMPARE_FUNC,de[w.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===Yt||w.minFilter!==vr&&w.minFilter!==fi||w.type===wn&&e.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){let G=e.get("EXT_texture_filter_anisotropic");s.texParameterf(I,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,i.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Ze(I,w){let G=!1;I.__webglInit===void 0&&(I.__webglInit=!0,w.addEventListener("dispose",A));let Y=w.source,ee=d.get(Y);ee===void 0&&(ee={},d.set(Y,ee));let X=U(w);if(X!==I.__cacheKey){ee[X]===void 0&&(ee[X]={texture:s.createTexture(),usedTimes:0},o.memory.textures++,G=!0),ee[X].usedTimes++;let Ae=ee[I.__cacheKey];Ae!==void 0&&(ee[I.__cacheKey].usedTimes--,Ae.usedTimes===0&&M(w)),I.__cacheKey=X,I.__webglTexture=ee[X].texture}return G}function et(I,w,G){return Math.floor(Math.floor(I/G)/w)}function Ye(I,w,G,Y){let X=I.updateRanges;if(X.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,w.width,w.height,G,Y,w.data);else{X.sort((ie,fe)=>ie.start-fe.start);let Ae=0;for(let ie=1;ie<X.length;ie++){let fe=X[Ae],Pe=X[ie],Se=fe.start+fe.count,he=et(Pe.start,w.width,4),Oe=et(fe.start,w.width,4);Pe.start<=Se+1&&he===Oe&&et(Pe.start+Pe.count-1,w.width,4)===he?fe.count=Math.max(fe.count,Pe.start+Pe.count-fe.start):(++Ae,X[Ae]=Pe)}X.length=Ae+1;let oe=s.getParameter(s.UNPACK_ROW_LENGTH),we=s.getParameter(s.UNPACK_SKIP_PIXELS),Me=s.getParameter(s.UNPACK_SKIP_ROWS);s.pixelStorei(s.UNPACK_ROW_LENGTH,w.width);for(let ie=0,fe=X.length;ie<fe;ie++){let Pe=X[ie],Se=Math.floor(Pe.start/4),he=Math.ceil(Pe.count/4),Oe=Se%w.width,z=Math.floor(Se/w.width),se=he,le=1;s.pixelStorei(s.UNPACK_SKIP_PIXELS,Oe),s.pixelStorei(s.UNPACK_SKIP_ROWS,z),t.texSubImage2D(s.TEXTURE_2D,0,Oe,z,se,le,G,Y,w.data)}I.clearUpdateRanges(),s.pixelStorei(s.UNPACK_ROW_LENGTH,oe),s.pixelStorei(s.UNPACK_SKIP_PIXELS,we),s.pixelStorei(s.UNPACK_SKIP_ROWS,Me)}}function $(I,w,G){let Y=s.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(Y=s.TEXTURE_2D_ARRAY),w.isData3DTexture&&(Y=s.TEXTURE_3D);let ee=Ze(I,w),X=w.source;t.bindTexture(Y,I.__webglTexture,s.TEXTURE0+G);let Ae=n.get(X);if(X.version!==Ae.__version||ee===!0){t.activeTexture(s.TEXTURE0+G);let oe=je.getPrimaries(je.workingColorSpace),we=w.colorSpace===Zn?null:je.getPrimaries(w.colorSpace),Me=w.colorSpace===Zn||oe===we?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,w.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,w.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Me);let ie=x(w.image,!1,i.maxTextureSize);ie=At(w,ie);let fe=r.convert(w.format,w.colorSpace),Pe=r.convert(w.type),Se=y(w.internalFormat,fe,Pe,w.colorSpace,w.isVideoTexture);re(Y,w);let he,Oe=w.mipmaps,z=w.isVideoTexture!==!0,se=Ae.__version===void 0||ee===!0,le=X.dataReady,ge=T(w,ie);if(w.isDepthTexture)Se=v(w.format===ys,w.type),se&&(z?t.texStorage2D(s.TEXTURE_2D,1,Se,ie.width,ie.height):t.texImage2D(s.TEXTURE_2D,0,Se,ie.width,ie.height,0,fe,Pe,null));else if(w.isDataTexture)if(Oe.length>0){z&&se&&t.texStorage2D(s.TEXTURE_2D,ge,Se,Oe[0].width,Oe[0].height);for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],z?le&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,Pe,he.data):t.texImage2D(s.TEXTURE_2D,te,Se,he.width,he.height,0,fe,Pe,he.data);w.generateMipmaps=!1}else z?(se&&t.texStorage2D(s.TEXTURE_2D,ge,Se,ie.width,ie.height),le&&Ye(w,ie,fe,Pe)):t.texImage2D(s.TEXTURE_2D,0,Se,ie.width,ie.height,0,fe,Pe,ie.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){z&&se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,ge,Se,Oe[0].width,Oe[0].height,ie.depth);for(let te=0,K=Oe.length;te<K;te++)if(he=Oe[te],w.format!==ln)if(fe!==null)if(z){if(le)if(w.layerUpdates.size>0){let ve=wc(he.width,he.height,w.format,w.type);for(let Be of w.layerUpdates){let ot=he.data.subarray(Be*ve/he.data.BYTES_PER_ELEMENT,(Be+1)*ve/he.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,Be,he.width,he.height,1,fe,ot)}w.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,he.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,te,Se,he.width,he.height,ie.depth,0,he.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else z?le&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,Pe,he.data):t.texImage3D(s.TEXTURE_2D_ARRAY,te,Se,he.width,he.height,ie.depth,0,fe,Pe,he.data)}else{z&&se&&t.texStorage2D(s.TEXTURE_2D,ge,Se,Oe[0].width,Oe[0].height);for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],w.format!==ln?fe!==null?z?le&&t.compressedTexSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,he.data):t.compressedTexImage2D(s.TEXTURE_2D,te,Se,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):z?le&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,he.width,he.height,fe,Pe,he.data):t.texImage2D(s.TEXTURE_2D,te,Se,he.width,he.height,0,fe,Pe,he.data)}else if(w.isDataArrayTexture)if(z){if(se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,ge,Se,ie.width,ie.height,ie.depth),le)if(w.layerUpdates.size>0){let te=wc(ie.width,ie.height,w.format,w.type);for(let K of w.layerUpdates){let ve=ie.data.subarray(K*te/ie.data.BYTES_PER_ELEMENT,(K+1)*te/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,K,ie.width,ie.height,1,fe,Pe,ve)}w.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,fe,Pe,ie.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Se,ie.width,ie.height,ie.depth,0,fe,Pe,ie.data);else if(w.isData3DTexture)z?(se&&t.texStorage3D(s.TEXTURE_3D,ge,Se,ie.width,ie.height,ie.depth),le&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,fe,Pe,ie.data)):t.texImage3D(s.TEXTURE_3D,0,Se,ie.width,ie.height,ie.depth,0,fe,Pe,ie.data);else if(w.isFramebufferTexture){if(se)if(z)t.texStorage2D(s.TEXTURE_2D,ge,Se,ie.width,ie.height);else{let te=ie.width,K=ie.height;for(let ve=0;ve<ge;ve++)t.texImage2D(s.TEXTURE_2D,ve,Se,te,K,0,fe,Pe,null),te>>=1,K>>=1}}else if(Oe.length>0){if(z&&se){let te=vt(Oe[0]);t.texStorage2D(s.TEXTURE_2D,ge,Se,te.width,te.height)}for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],z?le&&t.texSubImage2D(s.TEXTURE_2D,te,0,0,fe,Pe,he):t.texImage2D(s.TEXTURE_2D,te,Se,fe,Pe,he);w.generateMipmaps=!1}else if(z){if(se){let te=vt(ie);t.texStorage2D(s.TEXTURE_2D,ge,Se,te.width,te.height)}le&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,fe,Pe,ie)}else t.texImage2D(s.TEXTURE_2D,0,Se,fe,Pe,ie);p(w)&&g(Y),Ae.__version=X.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function Q(I,w,G){if(w.image.length!==6)return;let Y=Ze(I,w),ee=w.source;t.bindTexture(s.TEXTURE_CUBE_MAP,I.__webglTexture,s.TEXTURE0+G);let X=n.get(ee);if(ee.version!==X.__version||Y===!0){t.activeTexture(s.TEXTURE0+G);let Ae=je.getPrimaries(je.workingColorSpace),oe=w.colorSpace===Zn?null:je.getPrimaries(w.colorSpace),we=w.colorSpace===Zn||Ae===oe?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,w.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,w.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,we);let Me=w.isCompressedTexture||w.image[0].isCompressedTexture,ie=w.image[0]&&w.image[0].isDataTexture,fe=[];for(let K=0;K<6;K++)!Me&&!ie?fe[K]=x(w.image[K],!0,i.maxCubemapSize):fe[K]=ie?w.image[K].image:w.image[K],fe[K]=At(w,fe[K]);let Pe=fe[0],Se=r.convert(w.format,w.colorSpace),he=r.convert(w.type),Oe=y(w.internalFormat,Se,he,w.colorSpace),z=w.isVideoTexture!==!0,se=X.__version===void 0||Y===!0,le=ee.dataReady,ge=T(w,Pe);re(s.TEXTURE_CUBE_MAP,w);let te;if(Me){z&&se&&t.texStorage2D(s.TEXTURE_CUBE_MAP,ge,Oe,Pe.width,Pe.height);for(let K=0;K<6;K++){te=fe[K].mipmaps;for(let ve=0;ve<te.length;ve++){let Be=te[ve];w.format!==ln?Se!==null?z?le&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,0,0,Be.width,Be.height,Se,Be.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,Oe,Be.width,Be.height,0,Be.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):z?le&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,0,0,Be.width,Be.height,Se,he,Be.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,Oe,Be.width,Be.height,0,Se,he,Be.data)}}}else{if(te=w.mipmaps,z&&se){te.length>0&&ge++;let K=vt(fe[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,ge,Oe,K.width,K.height)}for(let K=0;K<6;K++)if(ie){z?le&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,fe[K].width,fe[K].height,Se,he,fe[K].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Oe,fe[K].width,fe[K].height,0,Se,he,fe[K].data);for(let ve=0;ve<te.length;ve++){let ot=te[ve].image[K].image;z?le&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,0,0,ot.width,ot.height,Se,he,ot.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,Oe,ot.width,ot.height,0,Se,he,ot.data)}}else{z?le&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Se,he,fe[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Oe,Se,he,fe[K]);for(let ve=0;ve<te.length;ve++){let Be=te[ve];z?le&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,0,0,Se,he,Be.image[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,Oe,Se,he,Be.image[K])}}}p(w)&&g(s.TEXTURE_CUBE_MAP),X.__version=ee.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function xe(I,w,G,Y,ee,X){let Ae=r.convert(G.format,G.colorSpace),oe=r.convert(G.type),we=y(G.internalFormat,Ae,oe,G.colorSpace),Me=n.get(w),ie=n.get(G);if(ie.__renderTarget=w,!Me.__hasExternalTextures){let fe=Math.max(1,w.width>>X),Pe=Math.max(1,w.height>>X);ee===s.TEXTURE_3D||ee===s.TEXTURE_2D_ARRAY?t.texImage3D(ee,X,we,fe,Pe,w.depth,0,Ae,oe,null):t.texImage2D(ee,X,we,fe,Pe,0,Ae,oe,null)}t.bindFramebuffer(s.FRAMEBUFFER,I),be(w)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,Y,ee,ie.__webglTexture,0,ft(w)):(ee===s.TEXTURE_2D||ee>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,Y,ee,ie.__webglTexture,X),t.bindFramebuffer(s.FRAMEBUFFER,null)}function De(I,w,G){if(s.bindRenderbuffer(s.RENDERBUFFER,I),w.depthBuffer){let Y=w.depthTexture,ee=Y&&Y.isDepthTexture?Y.type:null,X=v(w.stencilBuffer,ee),Ae=w.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,oe=ft(w);be(w)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,oe,X,w.width,w.height):G?s.renderbufferStorageMultisample(s.RENDERBUFFER,oe,X,w.width,w.height):s.renderbufferStorage(s.RENDERBUFFER,X,w.width,w.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,Ae,s.RENDERBUFFER,I)}else{let Y=w.textures;for(let ee=0;ee<Y.length;ee++){let X=Y[ee],Ae=r.convert(X.format,X.colorSpace),oe=r.convert(X.type),we=y(X.internalFormat,Ae,oe,X.colorSpace),Me=ft(w);G&&be(w)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Me,we,w.width,w.height):be(w)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Me,we,w.width,w.height):s.renderbufferStorage(s.RENDERBUFFER,we,w.width,w.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Te(I,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,I),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Y=n.get(w.depthTexture);Y.__renderTarget=w,(!Y.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),O(w.depthTexture,0);let ee=Y.__webglTexture,X=ft(w);if(w.depthTexture.format===ls)be(w)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,ee,0,X):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,ee,0);else if(w.depthTexture.format===ys)be(w)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,ee,0,X):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,ee,0);else throw new Error("Unknown depthTexture format")}function $e(I){let w=n.get(I),G=I.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==I.depthTexture){let Y=I.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),Y){let ee=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,Y.removeEventListener("dispose",ee)};Y.addEventListener("dispose",ee),w.__depthDisposeCallback=ee}w.__boundDepthTexture=Y}if(I.depthTexture&&!w.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");let Y=I.texture.mipmaps;Y&&Y.length>0?Te(w.__webglFramebuffer[0],I):Te(w.__webglFramebuffer,I)}else if(G){w.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(s.FRAMEBUFFER,w.__webglFramebuffer[Y]),w.__webglDepthbuffer[Y]===void 0)w.__webglDepthbuffer[Y]=s.createRenderbuffer(),De(w.__webglDepthbuffer[Y],I,!1);else{let ee=I.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=w.__webglDepthbuffer[Y];s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,X)}}else{let Y=I.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(s.FRAMEBUFFER,w.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=s.createRenderbuffer(),De(w.__webglDepthbuffer,I,!1);else{let ee=I.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=w.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,X)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function It(I,w,G){let Y=n.get(I);w!==void 0&&xe(Y.__webglFramebuffer,I,I.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),G!==void 0&&$e(I)}function N(I){let w=I.texture,G=n.get(I),Y=n.get(w);I.addEventListener("dispose",C);let ee=I.textures,X=I.isWebGLCubeRenderTarget===!0,Ae=ee.length>1;if(Ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=s.createTexture()),Y.__version=w.version,o.memory.textures++),X){G.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(w.mipmaps&&w.mipmaps.length>0){G.__webglFramebuffer[oe]=[];for(let we=0;we<w.mipmaps.length;we++)G.__webglFramebuffer[oe][we]=s.createFramebuffer()}else G.__webglFramebuffer[oe]=s.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){G.__webglFramebuffer=[];for(let oe=0;oe<w.mipmaps.length;oe++)G.__webglFramebuffer[oe]=s.createFramebuffer()}else G.__webglFramebuffer=s.createFramebuffer();if(Ae)for(let oe=0,we=ee.length;oe<we;oe++){let Me=n.get(ee[oe]);Me.__webglTexture===void 0&&(Me.__webglTexture=s.createTexture(),o.memory.textures++)}if(I.samples>0&&be(I)===!1){G.__webglMultisampledFramebuffer=s.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let oe=0;oe<ee.length;oe++){let we=ee[oe];G.__webglColorRenderbuffer[oe]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,G.__webglColorRenderbuffer[oe]);let Me=r.convert(we.format,we.colorSpace),ie=r.convert(we.type),fe=y(we.internalFormat,Me,ie,we.colorSpace,I.isXRRenderTarget===!0),Pe=ft(I);s.renderbufferStorageMultisample(s.RENDERBUFFER,Pe,fe,I.width,I.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+oe,s.RENDERBUFFER,G.__webglColorRenderbuffer[oe])}s.bindRenderbuffer(s.RENDERBUFFER,null),I.depthBuffer&&(G.__webglDepthRenderbuffer=s.createRenderbuffer(),De(G.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(X){t.bindTexture(s.TEXTURE_CUBE_MAP,Y.__webglTexture),re(s.TEXTURE_CUBE_MAP,w);for(let oe=0;oe<6;oe++)if(w.mipmaps&&w.mipmaps.length>0)for(let we=0;we<w.mipmaps.length;we++)xe(G.__webglFramebuffer[oe][we],I,w,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,we);else xe(G.__webglFramebuffer[oe],I,w,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);p(w)&&g(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ae){for(let oe=0,we=ee.length;oe<we;oe++){let Me=ee[oe],ie=n.get(Me),fe=s.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(fe=I.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(fe,ie.__webglTexture),re(fe,Me),xe(G.__webglFramebuffer,I,Me,s.COLOR_ATTACHMENT0+oe,fe,0),p(Me)&&g(fe)}t.unbindTexture()}else{let oe=s.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(oe=I.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(oe,Y.__webglTexture),re(oe,w),w.mipmaps&&w.mipmaps.length>0)for(let we=0;we<w.mipmaps.length;we++)xe(G.__webglFramebuffer[we],I,w,s.COLOR_ATTACHMENT0,oe,we);else xe(G.__webglFramebuffer,I,w,s.COLOR_ATTACHMENT0,oe,0);p(w)&&g(oe),t.unbindTexture()}I.depthBuffer&&$e(I)}function dt(I){let w=I.textures;for(let G=0,Y=w.length;G<Y;G++){let ee=w[G];if(p(ee)){let X=_(I),Ae=n.get(ee).__webglTexture;t.bindTexture(X,Ae),g(X),t.unbindTexture()}}}let Ue=[],Le=[];function ye(I){if(I.samples>0){if(be(I)===!1){let w=I.textures,G=I.width,Y=I.height,ee=s.COLOR_BUFFER_BIT,X=I.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Ae=n.get(I),oe=w.length>1;if(oe)for(let Me=0;Me<w.length;Me++)t.bindFramebuffer(s.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Me,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,Ae.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Me,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer);let we=I.texture.mipmaps;we&&we.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer);for(let Me=0;Me<w.length;Me++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(ee|=s.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(ee|=s.STENCIL_BUFFER_BIT)),oe){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,Ae.__webglColorRenderbuffer[Me]);let ie=n.get(w[Me]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,ie,0)}s.blitFramebuffer(0,0,G,Y,0,0,G,Y,ee,s.NEAREST),h===!0&&(Ue.length=0,Le.length=0,Ue.push(s.COLOR_ATTACHMENT0+Me),I.depthBuffer&&I.resolveDepthBuffer===!1&&(Ue.push(X),Le.push(X),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,Le)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Ue))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),oe)for(let Me=0;Me<w.length;Me++){t.bindFramebuffer(s.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Me,s.RENDERBUFFER,Ae.__webglColorRenderbuffer[Me]);let ie=n.get(w[Me]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,Ae.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Me,s.TEXTURE_2D,ie,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&h){let w=I.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[w])}}}function ft(I){return Math.min(i.maxSamples,I.samples)}function be(I){let w=n.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function ke(I){let w=o.render.frame;a.get(I)!==w&&(a.set(I,w),I.update())}function At(I,w){let G=I.colorSpace,Y=I.format,ee=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||G!==Ri&&G!==Zn&&(je.getTransfer(G)===tt?(Y!==ln||ee!==bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),w}function vt(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(u.width=I.naturalWidth||I.width,u.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(u.width=I.displayWidth,u.height=I.displayHeight):(u.width=I.width,u.height=I.height),u}this.allocateTextureUnit=L,this.resetTextureUnits=B,this.setTexture2D=O,this.setTexture2DArray=D,this.setTexture3D=j,this.setTextureCube=H,this.rebindTextures=It,this.setupRenderTarget=N,this.updateRenderTargetMipmap=dt,this.updateMultisampleRenderTarget=ye,this.setupDepthRenderbuffer=$e,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=be}function Yx(s,e){function t(n,i=Zn){let r,o=je.getTransfer(i);if(n===bn)return s.UNSIGNED_BYTE;if(n===ea)return s.UNSIGNED_SHORT_4_4_4_4;if(n===ta)return s.UNSIGNED_SHORT_5_5_5_1;if(n===oc)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===ac)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===sc)return s.BYTE;if(n===rc)return s.SHORT;if(n===xs)return s.UNSIGNED_SHORT;if(n===Qo)return s.INT;if(n===pi)return s.UNSIGNED_INT;if(n===wn)return s.FLOAT;if(n===_s)return s.HALF_FLOAT;if(n===lc)return s.ALPHA;if(n===cc)return s.RGB;if(n===ln)return s.RGBA;if(n===ls)return s.DEPTH_COMPONENT;if(n===ys)return s.DEPTH_STENCIL;if(n===na)return s.RED;if(n===ia)return s.RED_INTEGER;if(n===hc)return s.RG;if(n===sa)return s.RG_INTEGER;if(n===ra)return s.RGBA_INTEGER;if(n===yr||n===br||n===wr||n===Mr)if(o===tt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===yr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===wr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===yr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===wr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Mr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===oa||n===aa||n===la||n===ca)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===oa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===aa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===la)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ca)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ha||n===ua||n===da)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ha||n===ua)return o===tt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===da)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===fa||n===pa||n===ma||n===ga||n===xa||n===_a||n===va||n===ya||n===ba||n===wa||n===Ma||n===Sa||n===Aa||n===Ta)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===fa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===pa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ma)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ga)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===xa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===_a)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===va)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ya)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ba)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===wa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ma)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Sa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Aa)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ta)return o===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ea||n===Ca||n===Ra)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Ea)return o===tt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ra)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ia||n===Pa||n===La||n===Na)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ia)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Pa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===La)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Na)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===vs?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}var $x=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Zx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Fc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ar(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new yn({vertexShader:$x,fragmentShader:Zx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new Xn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Bc=class extends Wn{constructor(e,t){super();let n=this,i=null,r=1,o=null,l="local-floor",h=1,u=null,a=null,c=null,d=null,f=null,m=null,x=typeof XRWebGLBinding<"u",p=new Fc,g={},_=t.getContextAttributes(),y=null,v=null,T=[],A=[],C=new Ee,R=null,M=new Xt;M.viewport=new xt;let b=new Xt;b.viewport=new xt;let P=[M,b],B=new ko,L=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let Q=T[$];return Q===void 0&&(Q=new ds,T[$]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function($){let Q=T[$];return Q===void 0&&(Q=new ds,T[$]=Q),Q.getGripSpace()},this.getHand=function($){let Q=T[$];return Q===void 0&&(Q=new ds,T[$]=Q),Q.getHandSpace()};function O($){let Q=A.indexOf($.inputSource);if(Q===-1)return;let xe=T[Q];xe!==void 0&&(xe.update($.inputSource,$.frame,u||o),xe.dispatchEvent({type:$.type,data:$.inputSource}))}function D(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",D),i.removeEventListener("inputsourceschange",j);for(let $=0;$<T.length;$++){let Q=A[$];Q!==null&&(A[$]=null,T[$].disconnect(Q))}L=null,U=null,p.reset();for(let $ in g)delete g[$];e.setRenderTarget(y),f=null,d=null,c=null,i=null,v=null,Ye.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){l=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||o},this.setReferenceSpace=function($){u=$},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return c===null&&x&&(c=new XRWebGLBinding(i,t)),c},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function($){if(i=$,i!==null){if(y=e.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",D),i.addEventListener("inputsourceschange",j),_.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(C),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,De=null,Te=null;_.depth&&(Te=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=_.stencil?ys:ls,De=_.stencil?vs:pi);let $e={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:r};c=this.getBinding(),d=c.createProjectionLayer($e),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new Cn(d.textureWidth,d.textureHeight,{format:ln,type:bn,depthTexture:new or(d.textureWidth,d.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let xe={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,xe),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new Cn(f.framebufferWidth,f.framebufferHeight,{format:ln,type:bn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(h),u=null,o=await i.requestReferenceSpace(l),Ye.setContext(i),Ye.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function j($){for(let Q=0;Q<$.removed.length;Q++){let xe=$.removed[Q],De=A.indexOf(xe);De>=0&&(A[De]=null,T[De].disconnect(xe))}for(let Q=0;Q<$.added.length;Q++){let xe=$.added[Q],De=A.indexOf(xe);if(De===-1){for(let $e=0;$e<T.length;$e++)if($e>=A.length){A.push(xe),De=$e;break}else if(A[$e]===null){A[$e]=xe,De=$e;break}if(De===-1)break}let Te=T[De];Te&&Te.connect(xe)}}let H=new F,Z=new F;function ae($,Q,xe){H.setFromMatrixPosition(Q.matrixWorld),Z.setFromMatrixPosition(xe.matrixWorld);let De=H.distanceTo(Z),Te=Q.projectionMatrix.elements,$e=xe.projectionMatrix.elements,It=Te[14]/(Te[10]-1),N=Te[14]/(Te[10]+1),dt=(Te[9]+1)/Te[5],Ue=(Te[9]-1)/Te[5],Le=(Te[8]-1)/Te[0],ye=($e[8]+1)/$e[0],ft=It*Le,be=It*ye,ke=De/(-Le+ye),At=ke*-Le;if(Q.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(At),$.translateZ(ke),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Te[10]===-1)$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let vt=It+ke,I=N+ke,w=ft-At,G=be+(De-At),Y=dt*N/I*vt,ee=Ue*N/I*vt;$.projectionMatrix.makePerspective(w,G,Y,ee,vt,I),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function de($,Q){Q===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(Q.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(i===null)return;let Q=$.near,xe=$.far;p.texture!==null&&(p.depthNear>0&&(Q=p.depthNear),p.depthFar>0&&(xe=p.depthFar)),B.near=b.near=M.near=Q,B.far=b.far=M.far=xe,(L!==B.near||U!==B.far)&&(i.updateRenderState({depthNear:B.near,depthFar:B.far}),L=B.near,U=B.far),B.layers.mask=$.layers.mask|6,M.layers.mask=B.layers.mask&3,b.layers.mask=B.layers.mask&5;let De=$.parent,Te=B.cameras;de(B,De);for(let $e=0;$e<Te.length;$e++)de(Te[$e],De);Te.length===2?ae(B,M,b):B.projectionMatrix.copy(M.projectionMatrix),re($,B,De)};function re($,Q,xe){xe===null?$.matrix.copy(Q.matrixWorld):($.matrix.copy(xe.matrixWorld),$.matrix.invert(),$.matrix.multiply(Q.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=cs*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(d===null&&f===null))return h},this.setFoveation=function($){h=$,d!==null&&(d.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(B)},this.getCameraTexture=function($){return g[$]};let Ze=null;function et($,Q){if(a=Q.getViewerPose(u||o),m=Q,a!==null){let xe=a.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let De=!1;xe.length!==B.cameras.length&&(B.cameras.length=0,De=!0);for(let N=0;N<xe.length;N++){let dt=xe[N],Ue=null;if(f!==null)Ue=f.getViewport(dt);else{let ye=c.getViewSubImage(d,dt);Ue=ye.viewport,N===0&&(e.setRenderTargetTextures(v,ye.colorTexture,ye.depthStencilTexture),e.setRenderTarget(v))}let Le=P[N];Le===void 0&&(Le=new Xt,Le.layers.enable(N),Le.viewport=new xt,P[N]=Le),Le.matrix.fromArray(dt.transform.matrix),Le.matrix.decompose(Le.position,Le.quaternion,Le.scale),Le.projectionMatrix.fromArray(dt.projectionMatrix),Le.projectionMatrixInverse.copy(Le.projectionMatrix).invert(),Le.viewport.set(Ue.x,Ue.y,Ue.width,Ue.height),N===0&&(B.matrix.copy(Le.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),De===!0&&B.cameras.push(Le)}let Te=i.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&x){c=n.getBinding();let N=c.getDepthInformation(xe[0]);N&&N.isValid&&N.texture&&p.init(N,i.renderState)}if(Te&&Te.includes("camera-access")&&x){e.state.unbindTexture(),c=n.getBinding();for(let N=0;N<xe.length;N++){let dt=xe[N].camera;if(dt){let Ue=g[dt];Ue||(Ue=new ar,g[dt]=Ue);let Le=c.getCameraImage(dt);Ue.sourceTexture=Le}}}}for(let xe=0;xe<T.length;xe++){let De=A[xe],Te=T[xe];De!==null&&Te!==void 0&&Te.update(De,Q,u||o)}Ze&&Ze($,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),m=null}let Ye=new cd;Ye.setAnimationLoop(et),this.setAnimationLoop=function($){Ze=$},this.dispose=function(){}}},Oi=new _n,jx=new rt;function Kx(s,e){function t(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,_c(s)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function i(p,g,_,y,v){g.isMeshBasicMaterial||g.isMeshLambertMaterial?r(p,g):g.isMeshToonMaterial?(r(p,g),c(p,g)):g.isMeshPhongMaterial?(r(p,g),a(p,g)):g.isMeshStandardMaterial?(r(p,g),d(p,g),g.isMeshPhysicalMaterial&&f(p,g,v)):g.isMeshMatcapMaterial?(r(p,g),m(p,g)):g.isMeshDepthMaterial?r(p,g):g.isMeshDistanceMaterial?(r(p,g),x(p,g)):g.isMeshNormalMaterial?r(p,g):g.isLineBasicMaterial?(o(p,g),g.isLineDashedMaterial&&l(p,g)):g.isPointsMaterial?h(p,g,_,y):g.isSpriteMaterial?u(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,t(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===Gt&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,t(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===Gt&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,t(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,t(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);let _=e.get(g),y=_.envMap,v=_.envMapRotation;y&&(p.envMap.value=y,Oi.copy(v),Oi.x*=-1,Oi.y*=-1,Oi.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Oi.y*=-1,Oi.z*=-1),p.envMapRotation.value.setFromMatrix4(jx.makeRotationFromEuler(Oi)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,p.aoMapTransform))}function o(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform))}function l(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function h(p,g,_,y){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*_,p.scale.value=y*.5,g.map&&(p.map.value=g.map,t(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function u(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function a(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function c(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function d(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,_){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Gt&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=_.texture,p.transmissionSamplerSize.value.set(_.width,_.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function x(p,g){let _=e.get(g).light;p.referencePosition.value.setFromMatrixPosition(_.matrixWorld),p.nearDistance.value=_.shadow.camera.near,p.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Jx(s,e,t,n){let i={},r={},o=[],l=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function h(_,y){let v=y.program;n.uniformBlockBinding(_,v)}function u(_,y){let v=i[_.id];v===void 0&&(m(_),v=a(_),i[_.id]=v,_.addEventListener("dispose",p));let T=y.program;n.updateUBOMapping(_,T);let A=e.render.frame;r[_.id]!==A&&(d(_),r[_.id]=A)}function a(_){let y=c();_.__bindingPointIndex=y;let v=s.createBuffer(),T=_.__size,A=_.usage;return s.bindBuffer(s.UNIFORM_BUFFER,v),s.bufferData(s.UNIFORM_BUFFER,T,A),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,y,v),v}function c(){for(let _=0;_<l;_++)if(o.indexOf(_)===-1)return o.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(_){let y=i[_.id],v=_.uniforms,T=_.__cache;s.bindBuffer(s.UNIFORM_BUFFER,y);for(let A=0,C=v.length;A<C;A++){let R=Array.isArray(v[A])?v[A]:[v[A]];for(let M=0,b=R.length;M<b;M++){let P=R[M];if(f(P,A,M,T)===!0){let B=P.__offset,L=Array.isArray(P.value)?P.value:[P.value],U=0;for(let O=0;O<L.length;O++){let D=L[O],j=x(D);typeof D=="number"||typeof D=="boolean"?(P.__data[0]=D,s.bufferSubData(s.UNIFORM_BUFFER,B+U,P.__data)):D.isMatrix3?(P.__data[0]=D.elements[0],P.__data[1]=D.elements[1],P.__data[2]=D.elements[2],P.__data[3]=0,P.__data[4]=D.elements[3],P.__data[5]=D.elements[4],P.__data[6]=D.elements[5],P.__data[7]=0,P.__data[8]=D.elements[6],P.__data[9]=D.elements[7],P.__data[10]=D.elements[8],P.__data[11]=0):(D.toArray(P.__data,U),U+=j.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,B,P.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function f(_,y,v,T){let A=_.value,C=y+"_"+v;if(T[C]===void 0)return typeof A=="number"||typeof A=="boolean"?T[C]=A:T[C]=A.clone(),!0;{let R=T[C];if(typeof A=="number"||typeof A=="boolean"){if(R!==A)return T[C]=A,!0}else if(R.equals(A)===!1)return R.copy(A),!0}return!1}function m(_){let y=_.uniforms,v=0,T=16;for(let C=0,R=y.length;C<R;C++){let M=Array.isArray(y[C])?y[C]:[y[C]];for(let b=0,P=M.length;b<P;b++){let B=M[b],L=Array.isArray(B.value)?B.value:[B.value];for(let U=0,O=L.length;U<O;U++){let D=L[U],j=x(D),H=v%T,Z=H%j.boundary,ae=H+Z;v+=Z,ae!==0&&T-ae<j.storage&&(v+=T-ae),B.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=v,v+=j.storage}}}let A=v%T;return A>0&&(v+=T-A),_.__size=v,_.__cache={},this}function x(_){let y={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(y.boundary=4,y.storage=4):_.isVector2?(y.boundary=8,y.storage=8):_.isVector3||_.isColor?(y.boundary=16,y.storage=12):_.isVector4?(y.boundary=16,y.storage=16):_.isMatrix3?(y.boundary=48,y.storage=48):_.isMatrix4?(y.boundary=64,y.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),y}function p(_){let y=_.target;y.removeEventListener("dispose",p);let v=o.indexOf(y.__bindingPointIndex);o.splice(v,1),s.deleteBuffer(i[y.id]),delete i[y.id],delete r[y.id]}function g(){for(let _ in i)s.deleteBuffer(i[_]);o=[],i={},r={}}return{bind:h,update:u,dispose:g}}var za=class{constructor(e={}){let{canvas:t=Fu(),context:n=null,depth:i=!0,stencil:r=!1,alpha:o=!1,antialias:l=!1,premultipliedAlpha:h=!0,preserveDrawingBuffer:u=!1,powerPreference:a="default",failIfMajorPerformanceCaveat:c=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;let m=new Uint32Array(4),x=new Int32Array(4),p=null,g=null,_=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=$n,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let v=this,T=!1;this._outputColorSpace=Ct;let A=0,C=0,R=null,M=-1,b=null,P=new xt,B=new xt,L=null,U=new He(0),O=0,D=t.width,j=t.height,H=1,Z=null,ae=null,de=new xt(0,0,D,j),re=new xt(0,0,D,j),Ze=!1,et=new ps,Ye=!1,$=!1,Q=new rt,xe=new F,De=new xt,Te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},$e=!1;function It(){return R===null?H:1}let N=n;function dt(E,k){return t.getContext(E,k)}try{let E={alpha:!0,depth:i,stencil:r,antialias:l,premultipliedAlpha:h,preserveDrawingBuffer:u,powerPreference:a,failIfMajorPerformanceCaveat:c};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",ge,!1),t.addEventListener("webglcontextcreationerror",te,!1),N===null){let k="webgl2";if(N=dt(k,E),N===null)throw dt(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let Ue,Le,ye,ft,be,ke,At,vt,I,w,G,Y,ee,X,Ae,oe,we,Me,ie,fe,Pe,Se,he,Oe;function z(){Ue=new g0(N),Ue.init(),Se=new Yx(N,Ue),Le=new c0(N,Ue,e,Se),ye=new qx(N,Ue),Le.reversedDepthBuffer&&d&&ye.buffers.depth.setReversed(!0),ft=new v0(N),be=new Lx,ke=new Xx(N,Ue,ye,be,Le,Se,ft),At=new u0(v),vt=new m0(v),I=new Ap(N),he=new a0(N,I),w=new x0(N,I,ft,he),G=new b0(N,w,I,ft),ie=new y0(N,Le,ke),oe=new h0(be),Y=new Px(v,At,vt,Ue,Le,he,oe),ee=new Kx(v,be),X=new Dx,Ae=new kx(Ue),Me=new o0(v,At,vt,ye,G,f,h),we=new Gx(v,G,Le),Oe=new Jx(N,ft,Le,ye),fe=new l0(N,Ue,ft),Pe=new _0(N,Ue,ft),ft.programs=Y.programs,v.capabilities=Le,v.extensions=Ue,v.properties=be,v.renderLists=X,v.shadowMap=we,v.state=ye,v.info=ft}z();let se=new Bc(v,N);this.xr=se,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let E=Ue.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=Ue.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(E){E!==void 0&&(H=E,this.setSize(D,j,!1))},this.getSize=function(E){return E.set(D,j)},this.setSize=function(E,k,W=!0){if(se.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}D=E,j=k,t.width=Math.floor(E*H),t.height=Math.floor(k*H),W===!0&&(t.style.width=E+"px",t.style.height=k+"px"),this.setViewport(0,0,E,k)},this.getDrawingBufferSize=function(E){return E.set(D*H,j*H).floor()},this.setDrawingBufferSize=function(E,k,W){D=E,j=k,H=W,t.width=Math.floor(E*W),t.height=Math.floor(k*W),this.setViewport(0,0,E,k)},this.getCurrentViewport=function(E){return E.copy(P)},this.getViewport=function(E){return E.copy(de)},this.setViewport=function(E,k,W,q){E.isVector4?de.set(E.x,E.y,E.z,E.w):de.set(E,k,W,q),ye.viewport(P.copy(de).multiplyScalar(H).round())},this.getScissor=function(E){return E.copy(re)},this.setScissor=function(E,k,W,q){E.isVector4?re.set(E.x,E.y,E.z,E.w):re.set(E,k,W,q),ye.scissor(B.copy(re).multiplyScalar(H).round())},this.getScissorTest=function(){return Ze},this.setScissorTest=function(E){ye.setScissorTest(Ze=E)},this.setOpaqueSort=function(E){Z=E},this.setTransparentSort=function(E){ae=E},this.getClearColor=function(E){return E.copy(Me.getClearColor())},this.setClearColor=function(){Me.setClearColor(...arguments)},this.getClearAlpha=function(){return Me.getClearAlpha()},this.setClearAlpha=function(){Me.setClearAlpha(...arguments)},this.clear=function(E=!0,k=!0,W=!0){let q=0;if(E){let V=!1;if(R!==null){let ne=R.texture.format;V=ne===ra||ne===sa||ne===ia}if(V){let ne=R.texture.type,ue=ne===bn||ne===pi||ne===xs||ne===vs||ne===ea||ne===ta,_e=Me.getClearColor(),pe=Me.getClearAlpha(),Ie=_e.r,Ne=_e.g,Ce=_e.b;ue?(m[0]=Ie,m[1]=Ne,m[2]=Ce,m[3]=pe,N.clearBufferuiv(N.COLOR,0,m)):(x[0]=Ie,x[1]=Ne,x[2]=Ce,x[3]=pe,N.clearBufferiv(N.COLOR,0,x))}else q|=N.COLOR_BUFFER_BIT}k&&(q|=N.DEPTH_BUFFER_BIT),W&&(q|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",ge,!1),t.removeEventListener("webglcontextcreationerror",te,!1),Me.dispose(),X.dispose(),Ae.dispose(),be.dispose(),At.dispose(),vt.dispose(),G.dispose(),he.dispose(),Oe.dispose(),Y.dispose(),se.dispose(),se.removeEventListener("sessionstart",Tn),se.removeEventListener("sessionend",lh),vi.stop()};function le(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function ge(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;let E=ft.autoReset,k=we.enabled,W=we.autoUpdate,q=we.needsUpdate,V=we.type;z(),ft.autoReset=E,we.enabled=k,we.autoUpdate=W,we.needsUpdate=q,we.type=V}function te(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function K(E){let k=E.target;k.removeEventListener("dispose",K),ve(k)}function ve(E){Be(E),be.remove(E)}function Be(E){let k=be.get(E).programs;k!==void 0&&(k.forEach(function(W){Y.releaseProgram(W)}),E.isShaderMaterial&&Y.releaseShaderCache(E))}this.renderBufferDirect=function(E,k,W,q,V,ne){k===null&&(k=Te);let ue=V.isMesh&&V.matrixWorld.determinant()<0,_e=nf(E,k,W,q,V);ye.setMaterial(q,ue);let pe=W.index,Ie=1;if(q.wireframe===!0){if(pe=w.getWireframeAttribute(W),pe===void 0)return;Ie=2}let Ne=W.drawRange,Ce=W.attributes.position,qe=Ne.start*Ie,it=(Ne.start+Ne.count)*Ie;ne!==null&&(qe=Math.max(qe,ne.start*Ie),it=Math.min(it,(ne.start+ne.count)*Ie)),pe!==null?(qe=Math.max(qe,0),it=Math.min(it,pe.count)):Ce!=null&&(qe=Math.max(qe,0),it=Math.min(it,Ce.count));let _t=it-qe;if(_t<0||_t===1/0)return;he.setup(V,q,_e,W,pe);let at,st=fe;if(pe!==null&&(at=I.get(pe),st=Pe,st.setIndex(at)),V.isMesh)q.wireframe===!0?(ye.setLineWidth(q.wireframeLinewidth*It()),st.setMode(N.LINES)):st.setMode(N.TRIANGLES);else if(V.isLine){let Re=q.linewidth;Re===void 0&&(Re=1),ye.setLineWidth(Re*It()),V.isLineSegments?st.setMode(N.LINES):V.isLineLoop?st.setMode(N.LINE_LOOP):st.setMode(N.LINE_STRIP)}else V.isPoints?st.setMode(N.POINTS):V.isSprite&&st.setMode(N.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)hs("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(Ue.get("WEBGL_multi_draw"))st.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let Re=V._multiDrawStarts,mt=V._multiDrawCounts,Ke=V._multiDrawCount,jt=pe?I.get(pe).bytesPerElement:1,qi=be.get(q).currentProgram.getUniforms();for(let Kt=0;Kt<Ke;Kt++)qi.setValue(N,"_gl_DrawID",Kt),st.render(Re[Kt]/jt,mt[Kt])}else if(V.isInstancedMesh)st.renderInstances(qe,_t,V.count);else if(W.isInstancedBufferGeometry){let Re=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,mt=Math.min(W.instanceCount,Re);st.renderInstances(qe,_t,mt)}else st.render(qe,_t)};function ot(E,k,W){E.transparent===!0&&E.side===Ft&&E.forceSinglePass===!1?(E.side=Gt,E.needsUpdate=!0,Or(E,k,W),E.side=Gn,E.needsUpdate=!0,Or(E,k,W),E.side=Ft):Or(E,k,W)}this.compile=function(E,k,W=null){W===null&&(W=E),g=Ae.get(W),g.init(k),y.push(g),W.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(g.pushLight(V),V.castShadow&&g.pushShadow(V))}),E!==W&&E.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(g.pushLight(V),V.castShadow&&g.pushShadow(V))}),g.setupLights();let q=new Set;return E.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let ne=V.material;if(ne)if(Array.isArray(ne))for(let ue=0;ue<ne.length;ue++){let _e=ne[ue];ot(_e,W,V),q.add(_e)}else ot(ne,W,V),q.add(ne)}),g=y.pop(),q},this.compileAsync=function(E,k,W=null){let q=this.compile(E,k,W);return new Promise(V=>{function ne(){if(q.forEach(function(ue){be.get(ue).currentProgram.isReady()&&q.delete(ue)}),q.size===0){V(E);return}setTimeout(ne,10)}Ue.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Je=null;function Bn(E){Je&&Je(E)}function Tn(){vi.stop()}function lh(){vi.start()}let vi=new cd;vi.setAnimationLoop(Bn),typeof self<"u"&&vi.setContext(self),this.setAnimationLoop=function(E){Je=E,se.setAnimationLoop(E),E===null?vi.stop():vi.start()},se.addEventListener("sessionstart",Tn),se.addEventListener("sessionend",lh),this.render=function(E,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(se.cameraAutoUpdate===!0&&se.updateCamera(k),k=se.getCamera()),E.isScene===!0&&E.onBeforeRender(v,E,k,R),g=Ae.get(E,y.length),g.init(k),y.push(g),Q.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),et.setFromProjectionMatrix(Q,gn,k.reversedDepth),$=this.localClippingEnabled,Ye=oe.init(this.clippingPlanes,$),p=X.get(E,_.length),p.init(),_.push(p),se.enabled===!0&&se.isPresenting===!0){let ne=v.xr.getDepthSensingMesh();ne!==null&&dl(ne,k,-1/0,v.sortObjects)}dl(E,k,0,v.sortObjects),p.finish(),v.sortObjects===!0&&p.sort(Z,ae),$e=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,$e&&Me.addToRenderList(p,E),this.info.render.frame++,Ye===!0&&oe.beginShadows();let W=g.state.shadowsArray;we.render(W,E,k),Ye===!0&&oe.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=p.opaque,V=p.transmissive;if(g.setupLights(),k.isArrayCamera){let ne=k.cameras;if(V.length>0)for(let ue=0,_e=ne.length;ue<_e;ue++){let pe=ne[ue];hh(q,V,E,pe)}$e&&Me.render(E);for(let ue=0,_e=ne.length;ue<_e;ue++){let pe=ne[ue];ch(p,E,pe,pe.viewport)}}else V.length>0&&hh(q,V,E,k),$e&&Me.render(E),ch(p,E,k);R!==null&&C===0&&(ke.updateMultisampleRenderTarget(R),ke.updateRenderTargetMipmap(R)),E.isScene===!0&&E.onAfterRender(v,E,k),he.resetDefaultState(),M=-1,b=null,y.pop(),y.length>0?(g=y[y.length-1],Ye===!0&&oe.setGlobalState(v.clippingPlanes,g.state.camera)):g=null,_.pop(),_.length>0?p=_[_.length-1]:p=null};function dl(E,k,W,q){if(E.visible===!1)return;if(E.layers.test(k.layers)){if(E.isGroup)W=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(k);else if(E.isLight)g.pushLight(E),E.castShadow&&g.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||et.intersectsSprite(E)){q&&De.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Q);let ue=G.update(E),_e=E.material;_e.visible&&p.push(E,ue,_e,W,De.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||et.intersectsObject(E))){let ue=G.update(E),_e=E.material;if(q&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),De.copy(E.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),De.copy(ue.boundingSphere.center)),De.applyMatrix4(E.matrixWorld).applyMatrix4(Q)),Array.isArray(_e)){let pe=ue.groups;for(let Ie=0,Ne=pe.length;Ie<Ne;Ie++){let Ce=pe[Ie],qe=_e[Ce.materialIndex];qe&&qe.visible&&p.push(E,ue,qe,W,De.z,Ce)}}else _e.visible&&p.push(E,ue,_e,W,De.z,null)}}let ne=E.children;for(let ue=0,_e=ne.length;ue<_e;ue++)dl(ne[ue],k,W,q)}function ch(E,k,W,q){let V=E.opaque,ne=E.transmissive,ue=E.transparent;g.setupLightsView(W),Ye===!0&&oe.setGlobalState(v.clippingPlanes,W),q&&ye.viewport(P.copy(q)),V.length>0&&zr(V,k,W),ne.length>0&&zr(ne,k,W),ue.length>0&&zr(ue,k,W),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function hh(E,k,W,q){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;g.state.transmissionRenderTarget[q.id]===void 0&&(g.state.transmissionRenderTarget[q.id]=new Cn(1,1,{generateMipmaps:!0,type:Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float")?_s:bn,minFilter:fi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:je.workingColorSpace}));let ne=g.state.transmissionRenderTarget[q.id],ue=q.viewport||P;ne.setSize(ue.z*v.transmissionResolutionScale,ue.w*v.transmissionResolutionScale);let _e=v.getRenderTarget(),pe=v.getActiveCubeFace(),Ie=v.getActiveMipmapLevel();v.setRenderTarget(ne),v.getClearColor(U),O=v.getClearAlpha(),O<1&&v.setClearColor(16777215,.5),v.clear(),$e&&Me.render(W);let Ne=v.toneMapping;v.toneMapping=$n;let Ce=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),g.setupLightsView(q),Ye===!0&&oe.setGlobalState(v.clippingPlanes,q),zr(E,W,q),ke.updateMultisampleRenderTarget(ne),ke.updateRenderTargetMipmap(ne),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let qe=!1;for(let it=0,_t=k.length;it<_t;it++){let at=k[it],st=at.object,Re=at.geometry,mt=at.material,Ke=at.group;if(mt.side===Ft&&st.layers.test(q.layers)){let jt=mt.side;mt.side=Gt,mt.needsUpdate=!0,uh(st,W,q,Re,mt,Ke),mt.side=jt,mt.needsUpdate=!0,qe=!0}}qe===!0&&(ke.updateMultisampleRenderTarget(ne),ke.updateRenderTargetMipmap(ne))}v.setRenderTarget(_e,pe,Ie),v.setClearColor(U,O),Ce!==void 0&&(q.viewport=Ce),v.toneMapping=Ne}function zr(E,k,W){let q=k.isScene===!0?k.overrideMaterial:null;for(let V=0,ne=E.length;V<ne;V++){let ue=E[V],_e=ue.object,pe=ue.geometry,Ie=ue.group,Ne=ue.material;Ne.allowOverride===!0&&q!==null&&(Ne=q),_e.layers.test(W.layers)&&uh(_e,k,W,pe,Ne,Ie)}}function uh(E,k,W,q,V,ne){E.onBeforeRender(v,k,W,q,V,ne),E.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),V.onBeforeRender(v,k,W,q,E,ne),V.transparent===!0&&V.side===Ft&&V.forceSinglePass===!1?(V.side=Gt,V.needsUpdate=!0,v.renderBufferDirect(W,k,q,V,E,ne),V.side=Gn,V.needsUpdate=!0,v.renderBufferDirect(W,k,q,V,E,ne),V.side=Ft):v.renderBufferDirect(W,k,q,V,E,ne),E.onAfterRender(v,k,W,q,V,ne)}function Or(E,k,W){k.isScene!==!0&&(k=Te);let q=be.get(E),V=g.state.lights,ne=g.state.shadowsArray,ue=V.state.version,_e=Y.getParameters(E,V.state,ne,k,W),pe=Y.getProgramCacheKey(_e),Ie=q.programs;q.environment=E.isMeshStandardMaterial?k.environment:null,q.fog=k.fog,q.envMap=(E.isMeshStandardMaterial?vt:At).get(E.envMap||q.environment),q.envMapRotation=q.environment!==null&&E.envMap===null?k.environmentRotation:E.envMapRotation,Ie===void 0&&(E.addEventListener("dispose",K),Ie=new Map,q.programs=Ie);let Ne=Ie.get(pe);if(Ne!==void 0){if(q.currentProgram===Ne&&q.lightsStateVersion===ue)return fh(E,_e),Ne}else _e.uniforms=Y.getUniforms(E),E.onBeforeCompile(_e,v),Ne=Y.acquireProgram(_e,pe),Ie.set(pe,Ne),q.uniforms=_e.uniforms;let Ce=q.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ce.clippingPlanes=oe.uniform),fh(E,_e),q.needsLights=rf(E),q.lightsStateVersion=ue,q.needsLights&&(Ce.ambientLightColor.value=V.state.ambient,Ce.lightProbe.value=V.state.probe,Ce.directionalLights.value=V.state.directional,Ce.directionalLightShadows.value=V.state.directionalShadow,Ce.spotLights.value=V.state.spot,Ce.spotLightShadows.value=V.state.spotShadow,Ce.rectAreaLights.value=V.state.rectArea,Ce.ltc_1.value=V.state.rectAreaLTC1,Ce.ltc_2.value=V.state.rectAreaLTC2,Ce.pointLights.value=V.state.point,Ce.pointLightShadows.value=V.state.pointShadow,Ce.hemisphereLights.value=V.state.hemi,Ce.directionalShadowMap.value=V.state.directionalShadowMap,Ce.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ce.spotShadowMap.value=V.state.spotShadowMap,Ce.spotLightMatrix.value=V.state.spotLightMatrix,Ce.spotLightMap.value=V.state.spotLightMap,Ce.pointShadowMap.value=V.state.pointShadowMap,Ce.pointShadowMatrix.value=V.state.pointShadowMatrix),q.currentProgram=Ne,q.uniformsList=null,Ne}function dh(E){if(E.uniformsList===null){let k=E.currentProgram.getUniforms();E.uniformsList=Ss.seqWithValue(k.seq,E.uniforms)}return E.uniformsList}function fh(E,k){let W=be.get(E);W.outputColorSpace=k.outputColorSpace,W.batching=k.batching,W.batchingColor=k.batchingColor,W.instancing=k.instancing,W.instancingColor=k.instancingColor,W.instancingMorph=k.instancingMorph,W.skinning=k.skinning,W.morphTargets=k.morphTargets,W.morphNormals=k.morphNormals,W.morphColors=k.morphColors,W.morphTargetsCount=k.morphTargetsCount,W.numClippingPlanes=k.numClippingPlanes,W.numIntersection=k.numClipIntersection,W.vertexAlphas=k.vertexAlphas,W.vertexTangents=k.vertexTangents,W.toneMapping=k.toneMapping}function nf(E,k,W,q,V){k.isScene!==!0&&(k=Te),ke.resetTextureUnits();let ne=k.fog,ue=q.isMeshStandardMaterial?k.environment:null,_e=R===null?v.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:Ri,pe=(q.isMeshStandardMaterial?vt:At).get(q.envMap||ue),Ie=q.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ne=!!W.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Ce=!!W.morphAttributes.position,qe=!!W.morphAttributes.normal,it=!!W.morphAttributes.color,_t=$n;q.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(_t=v.toneMapping);let at=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,st=at!==void 0?at.length:0,Re=be.get(q),mt=g.state.lights;if(Ye===!0&&($===!0||E!==b)){let Ot=E===b&&q.id===M;oe.setState(q,E,Ot)}let Ke=!1;q.version===Re.__version?(Re.needsLights&&Re.lightsStateVersion!==mt.state.version||Re.outputColorSpace!==_e||V.isBatchedMesh&&Re.batching===!1||!V.isBatchedMesh&&Re.batching===!0||V.isBatchedMesh&&Re.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Re.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Re.instancing===!1||!V.isInstancedMesh&&Re.instancing===!0||V.isSkinnedMesh&&Re.skinning===!1||!V.isSkinnedMesh&&Re.skinning===!0||V.isInstancedMesh&&Re.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Re.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Re.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Re.instancingMorph===!1&&V.morphTexture!==null||Re.envMap!==pe||q.fog===!0&&Re.fog!==ne||Re.numClippingPlanes!==void 0&&(Re.numClippingPlanes!==oe.numPlanes||Re.numIntersection!==oe.numIntersection)||Re.vertexAlphas!==Ie||Re.vertexTangents!==Ne||Re.morphTargets!==Ce||Re.morphNormals!==qe||Re.morphColors!==it||Re.toneMapping!==_t||Re.morphTargetsCount!==st)&&(Ke=!0):(Ke=!0,Re.__version=q.version);let jt=Re.currentProgram;Ke===!0&&(jt=Or(q,k,V));let qi=!1,Kt=!1,Fs=!1,gt=jt.getUniforms(),sn=Re.uniforms;if(ye.useProgram(jt.program)&&(qi=!0,Kt=!0,Fs=!0),q.id!==M&&(M=q.id,Kt=!0),qi||b!==E){ye.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),gt.setValue(N,"projectionMatrix",E.projectionMatrix),gt.setValue(N,"viewMatrix",E.matrixWorldInverse);let qt=gt.map.cameraPosition;qt!==void 0&&qt.setValue(N,xe.setFromMatrixPosition(E.matrixWorld)),Le.logarithmicDepthBuffer&&gt.setValue(N,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&gt.setValue(N,"isOrthographic",E.isOrthographicCamera===!0),b!==E&&(b=E,Kt=!0,Fs=!0)}if(V.isSkinnedMesh){gt.setOptional(N,V,"bindMatrix"),gt.setOptional(N,V,"bindMatrixInverse");let Ot=V.skeleton;Ot&&(Ot.boneTexture===null&&Ot.computeBoneTexture(),gt.setValue(N,"boneTexture",Ot.boneTexture,ke))}V.isBatchedMesh&&(gt.setOptional(N,V,"batchingTexture"),gt.setValue(N,"batchingTexture",V._matricesTexture,ke),gt.setOptional(N,V,"batchingIdTexture"),gt.setValue(N,"batchingIdTexture",V._indirectTexture,ke),gt.setOptional(N,V,"batchingColorTexture"),V._colorsTexture!==null&&gt.setValue(N,"batchingColorTexture",V._colorsTexture,ke));let rn=W.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&ie.update(V,W,jt),(Kt||Re.receiveShadow!==V.receiveShadow)&&(Re.receiveShadow=V.receiveShadow,gt.setValue(N,"receiveShadow",V.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(sn.envMap.value=pe,sn.flipEnvMap.value=pe.isCubeTexture&&pe.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&k.environment!==null&&(sn.envMapIntensity.value=k.environmentIntensity),Kt&&(gt.setValue(N,"toneMappingExposure",v.toneMappingExposure),Re.needsLights&&sf(sn,Fs),ne&&q.fog===!0&&ee.refreshFogUniforms(sn,ne),ee.refreshMaterialUniforms(sn,q,H,j,g.state.transmissionRenderTarget[E.id]),Ss.upload(N,dh(Re),sn,ke)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Ss.upload(N,dh(Re),sn,ke),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&gt.setValue(N,"center",V.center),gt.setValue(N,"modelViewMatrix",V.modelViewMatrix),gt.setValue(N,"normalMatrix",V.normalMatrix),gt.setValue(N,"modelMatrix",V.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Ot=q.uniformsGroups;for(let qt=0,fl=Ot.length;qt<fl;qt++){let yi=Ot[qt];Oe.update(yi,jt),Oe.bind(yi,jt)}}return jt}function sf(E,k){E.ambientLightColor.needsUpdate=k,E.lightProbe.needsUpdate=k,E.directionalLights.needsUpdate=k,E.directionalLightShadows.needsUpdate=k,E.pointLights.needsUpdate=k,E.pointLightShadows.needsUpdate=k,E.spotLights.needsUpdate=k,E.spotLightShadows.needsUpdate=k,E.rectAreaLights.needsUpdate=k,E.hemisphereLights.needsUpdate=k}function rf(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(E,k,W){let q=be.get(E);q.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),be.get(E.texture).__webglTexture=k,be.get(E.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:W,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,k){let W=be.get(E);W.__webglFramebuffer=k,W.__useDefaultFramebuffer=k===void 0};let of=N.createFramebuffer();this.setRenderTarget=function(E,k=0,W=0){R=E,A=k,C=W;let q=!0,V=null,ne=!1,ue=!1;if(E){let pe=be.get(E);if(pe.__useDefaultFramebuffer!==void 0)ye.bindFramebuffer(N.FRAMEBUFFER,null),q=!1;else if(pe.__webglFramebuffer===void 0)ke.setupRenderTarget(E);else if(pe.__hasExternalTextures)ke.rebindTextures(E,be.get(E.texture).__webglTexture,be.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ce=E.depthTexture;if(pe.__boundDepthTexture!==Ce){if(Ce!==null&&be.has(Ce)&&(E.width!==Ce.image.width||E.height!==Ce.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");ke.setupDepthRenderbuffer(E)}}let Ie=E.texture;(Ie.isData3DTexture||Ie.isDataArrayTexture||Ie.isCompressedArrayTexture)&&(ue=!0);let Ne=be.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ne[k])?V=Ne[k][W]:V=Ne[k],ne=!0):E.samples>0&&ke.useMultisampledRTT(E)===!1?V=be.get(E).__webglMultisampledFramebuffer:Array.isArray(Ne)?V=Ne[W]:V=Ne,P.copy(E.viewport),B.copy(E.scissor),L=E.scissorTest}else P.copy(de).multiplyScalar(H).floor(),B.copy(re).multiplyScalar(H).floor(),L=Ze;if(W!==0&&(V=of),ye.bindFramebuffer(N.FRAMEBUFFER,V)&&q&&ye.drawBuffers(E,V),ye.viewport(P),ye.scissor(B),ye.setScissorTest(L),ne){let pe=be.get(E.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+k,pe.__webglTexture,W)}else if(ue){let pe=k;for(let Ie=0;Ie<E.textures.length;Ie++){let Ne=be.get(E.textures[Ie]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Ie,Ne.__webglTexture,W,pe)}}else if(E!==null&&W!==0){let pe=be.get(E.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,pe.__webglTexture,W)}M=-1},this.readRenderTargetPixels=function(E,k,W,q,V,ne,ue,_e=0){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=be.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe){ye.bindFramebuffer(N.FRAMEBUFFER,pe);try{let Ie=E.textures[_e],Ne=Ie.format,Ce=Ie.type;if(!Le.textureFormatReadable(Ne)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Le.textureTypeReadable(Ce)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=E.width-q&&W>=0&&W<=E.height-V&&(E.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e),N.readPixels(k,W,q,V,Se.convert(Ne),Se.convert(Ce),ne))}finally{let Ie=R!==null?be.get(R).__webglFramebuffer:null;ye.bindFramebuffer(N.FRAMEBUFFER,Ie)}}},this.readRenderTargetPixelsAsync=async function(E,k,W,q,V,ne,ue,_e=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=be.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe)if(k>=0&&k<=E.width-q&&W>=0&&W<=E.height-V){ye.bindFramebuffer(N.FRAMEBUFFER,pe);let Ie=E.textures[_e],Ne=Ie.format,Ce=Ie.type;if(!Le.textureFormatReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Le.textureTypeReadable(Ce))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let qe=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,qe),N.bufferData(N.PIXEL_PACK_BUFFER,ne.byteLength,N.STREAM_READ),E.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e),N.readPixels(k,W,q,V,Se.convert(Ne),Se.convert(Ce),0);let it=R!==null?be.get(R).__webglFramebuffer:null;ye.bindFramebuffer(N.FRAMEBUFFER,it);let _t=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Bu(N,_t,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,qe),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,ne),N.deleteBuffer(qe),N.deleteSync(_t),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,k=null,W=0){let q=Math.pow(2,-W),V=Math.floor(E.image.width*q),ne=Math.floor(E.image.height*q),ue=k!==null?k.x:0,_e=k!==null?k.y:0;ke.setTexture2D(E,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,ue,_e,V,ne),ye.unbindTexture()};let af=N.createFramebuffer(),lf=N.createFramebuffer();this.copyTextureToTexture=function(E,k,W=null,q=null,V=0,ne=null){ne===null&&(V!==0?(hs("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),ne=V,V=0):ne=0);let ue,_e,pe,Ie,Ne,Ce,qe,it,_t,at=E.isCompressedTexture?E.mipmaps[ne]:E.image;if(W!==null)ue=W.max.x-W.min.x,_e=W.max.y-W.min.y,pe=W.isBox3?W.max.z-W.min.z:1,Ie=W.min.x,Ne=W.min.y,Ce=W.isBox3?W.min.z:0;else{let rn=Math.pow(2,-V);ue=Math.floor(at.width*rn),_e=Math.floor(at.height*rn),E.isDataArrayTexture?pe=at.depth:E.isData3DTexture?pe=Math.floor(at.depth*rn):pe=1,Ie=0,Ne=0,Ce=0}q!==null?(qe=q.x,it=q.y,_t=q.z):(qe=0,it=0,_t=0);let st=Se.convert(k.format),Re=Se.convert(k.type),mt;k.isData3DTexture?(ke.setTexture3D(k,0),mt=N.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(ke.setTexture2DArray(k,0),mt=N.TEXTURE_2D_ARRAY):(ke.setTexture2D(k,0),mt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,k.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,k.unpackAlignment);let Ke=N.getParameter(N.UNPACK_ROW_LENGTH),jt=N.getParameter(N.UNPACK_IMAGE_HEIGHT),qi=N.getParameter(N.UNPACK_SKIP_PIXELS),Kt=N.getParameter(N.UNPACK_SKIP_ROWS),Fs=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,at.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,at.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Ie),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ne),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ce);let gt=E.isDataArrayTexture||E.isData3DTexture,sn=k.isDataArrayTexture||k.isData3DTexture;if(E.isDepthTexture){let rn=be.get(E),Ot=be.get(k),qt=be.get(rn.__renderTarget),fl=be.get(Ot.__renderTarget);ye.bindFramebuffer(N.READ_FRAMEBUFFER,qt.__webglFramebuffer),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,fl.__webglFramebuffer);for(let yi=0;yi<pe;yi++)gt&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,be.get(E).__webglTexture,V,Ce+yi),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,be.get(k).__webglTexture,ne,_t+yi)),N.blitFramebuffer(Ie,Ne,ue,_e,qe,it,ue,_e,N.DEPTH_BUFFER_BIT,N.NEAREST);ye.bindFramebuffer(N.READ_FRAMEBUFFER,null),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(V!==0||E.isRenderTargetTexture||be.has(E)){let rn=be.get(E),Ot=be.get(k);ye.bindFramebuffer(N.READ_FRAMEBUFFER,af),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,lf);for(let qt=0;qt<pe;qt++)gt?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,rn.__webglTexture,V,Ce+qt):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,rn.__webglTexture,V),sn?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ot.__webglTexture,ne,_t+qt):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Ot.__webglTexture,ne),V!==0?N.blitFramebuffer(Ie,Ne,ue,_e,qe,it,ue,_e,N.COLOR_BUFFER_BIT,N.NEAREST):sn?N.copyTexSubImage3D(mt,ne,qe,it,_t+qt,Ie,Ne,ue,_e):N.copyTexSubImage2D(mt,ne,qe,it,Ie,Ne,ue,_e);ye.bindFramebuffer(N.READ_FRAMEBUFFER,null),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else sn?E.isDataTexture||E.isData3DTexture?N.texSubImage3D(mt,ne,qe,it,_t,ue,_e,pe,st,Re,at.data):k.isCompressedArrayTexture?N.compressedTexSubImage3D(mt,ne,qe,it,_t,ue,_e,pe,st,at.data):N.texSubImage3D(mt,ne,qe,it,_t,ue,_e,pe,st,Re,at):E.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,ne,qe,it,ue,_e,st,Re,at.data):E.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,ne,qe,it,at.width,at.height,st,at.data):N.texSubImage2D(N.TEXTURE_2D,ne,qe,it,ue,_e,st,Re,at);N.pixelStorei(N.UNPACK_ROW_LENGTH,Ke),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,jt),N.pixelStorei(N.UNPACK_SKIP_PIXELS,qi),N.pixelStorei(N.UNPACK_SKIP_ROWS,Kt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Fs),ne===0&&k.generateMipmaps&&N.generateMipmap(mt),ye.unbindTexture()},this.initRenderTarget=function(E){be.get(E).__webglFramebuffer===void 0&&ke.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?ke.setTextureCube(E,0):E.isData3DTexture?ke.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?ke.setTexture2DArray(E,0):ke.setTexture2D(E,0),ye.unbindTexture()},this.resetState=function(){A=0,C=0,R=null,ye.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return gn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=je._getDrawingBufferColorSpace(e),t.unpackColorSpace=je._getUnpackColorSpace()}};var Ar=new F;function cn(s,e,t,n,i,r){let o=2*Math.PI*i/4,l=Math.max(r-2*i,0),h=Math.PI/4;Ar.copy(e),Ar[n]=0,Ar.normalize();let u=.5*o/(o+l),a=1-Ar.angleTo(s)/h;return Math.sign(Ar[t])===1?a*u:l/(o+l)+u+u*(1-a)}var ka=class s extends vn{constructor(e=1,t=1,n=1,i=2,r=.1){let o=i*2+1;if(r=Math.min(e/2,t/2,n/2,r),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:i,radius:r},o===1)return;let l=this.toNonIndexed();this.index=null,this.attributes.position=l.attributes.position,this.attributes.normal=l.attributes.normal,this.attributes.uv=l.attributes.uv;let h=new F,u=new F,a=new F(e,t,n).divideScalar(2).subScalar(r),c=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,m=c.length/6,x=new F,p=.5/o;for(let g=0,_=0;g<c.length;g+=3,_+=2)switch(h.fromArray(c,g),u.copy(h),u.x-=Math.sign(u.x)*p,u.y-=Math.sign(u.y)*p,u.z-=Math.sign(u.z)*p,u.normalize(),c[g+0]=a.x*Math.sign(h.x)+u.x*r,c[g+1]=a.y*Math.sign(h.y)+u.y*r,c[g+2]=a.z*Math.sign(h.z)+u.z*r,d[g+0]=u.x,d[g+1]=u.y,d[g+2]=u.z,Math.floor(g/m)){case 0:x.set(1,0,0),f[_+0]=cn(x,u,"z","y",r,n),f[_+1]=1-cn(x,u,"y","z",r,t);break;case 1:x.set(-1,0,0),f[_+0]=1-cn(x,u,"z","y",r,n),f[_+1]=1-cn(x,u,"y","z",r,t);break;case 2:x.set(0,1,0),f[_+0]=1-cn(x,u,"x","z",r,e),f[_+1]=cn(x,u,"z","x",r,n);break;case 3:x.set(0,-1,0),f[_+0]=1-cn(x,u,"x","z",r,e),f[_+1]=1-cn(x,u,"z","x",r,n);break;case 4:x.set(0,0,1),f[_+0]=1-cn(x,u,"x","y",r,e),f[_+1]=1-cn(x,u,"y","x",r,t);break;case 5:x.set(0,0,-1),f[_+0]=cn(x,u,"x","y",r,e),f[_+1]=1-cn(x,u,"y","x",r,t);break}}static fromJSON(e){return new s(e.width,e.height,e.depth,e.segments,e.radius)}};function gd(s,e=!1){let t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},o={},l=s[0].morphTargetsRelative,h=new Dt,u=0;for(let a=0;a<s.length;++a){let c=s[a],d=0;if(t!==(c.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in c.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(c.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". Make sure all geometries have the same number of attributes."),null;if(l!==c.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in c.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(c.morphAttributes[f])}if(e){let f;if(t)f=c.index.count;else if(c.attributes.position!==void 0)f=c.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". The geometry must have either an index or a position attribute"),null;h.addGroup(u,f,a),u+=f}}if(t){let a=0,c=[];for(let d=0;d<s.length;++d){let f=s[d].index;for(let m=0;m<f.count;++m)c.push(f.getX(m)+a);a+=s[d].attributes.position.count}h.setIndex(c)}for(let a in r){let c=md(r[a]);if(!c)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+a+" attribute."),null;h.setAttribute(a,c)}for(let a in o){let c=o[a][0].length;if(c===0)break;h.morphAttributes=h.morphAttributes||{},h.morphAttributes[a]=[];for(let d=0;d<c;++d){let f=[];for(let x=0;x<o[a].length;++x)f.push(o[a][x][d]);let m=md(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+a+" morphAttribute."),null;h.morphAttributes[a].push(m)}}return h}function md(s){let e,t,n,i=-1,r=0;for(let u=0;u<s.length;++u){let a=s[u];if(e===void 0&&(e=a.array.constructor),e!==a.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=a.itemSize),t!==a.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=a.normalized),n!==a.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=a.gpuType),i!==a.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=a.count*t}let o=new e(r),l=new Nt(o,t,n),h=0;for(let u=0;u<s.length;++u){let a=s[u];if(a.isInterleavedBufferAttribute){let c=h/t;for(let d=0,f=a.count;d<f;d++)for(let m=0;m<t;m++){let x=a.getComponent(d,m);l.setComponent(d+c,m,x)}}else o.set(a.array,h);h+=a.count*t}return i!==void 0&&(l.gpuType=i),l}var J={ink:"#202d36",blue:"#234ce7",yellow:"#ffda44",paper:"#fff7df",coral:"#f0805e",mint:"#90b9a1",metal:"#567581",dark:"#324b59"},Ts=new Map,zc=new Map;function hn(s,e=!1){let t=`${s}:${e}`;if(!Ts.has(t)){let n=new Li({color:s,roughness:.72,metalness:.08,emissive:e?s:"#000000",emissiveIntensity:e?.6:0});n.userData.shared=!0,Ts.set(t,n)}return Ts.get(t)}function Er(s,e){if(!zc.has(s)){let t=e();t.userData.shared=!0,zc.set(s,t)}return zc.get(s)}var Qx=()=>Er("box",()=>new ka(1,1,1,2,.09)),e_=()=>Er("cylinder",()=>new lr(1,1,1,24)),t_=()=>Er("sphere",()=>new Pi(1,20,12)),xd=()=>Er("plane",()=>new Xn(1,1));function Hi(s,e,t,n,i,r,o=1,l=1,h=1){let u=new ht(e,typeof t=="string"?hn(t):t);return u.position.set(n,i,r),u.scale.set(o,l,h),u.castShadow=!0,u.receiveShadow=!0,s.add(u),u}var Fe=(s,e,t,n,i,r,o,l)=>Hi(s,Qx(),e,t,n,i,r,o,l),pt=(s,e,t,n,i,r,o)=>Hi(s,e_(),e,t,n,i,r,o,r),mi=(s,e,t,n,i,r)=>Hi(s,t_(),e,t,n,i,r,r,r);function Va(s,e,t,n,i,r,o=.08){let l=Er(`torus:${r}:${o}`,()=>new dr(r,o,6,36));return Hi(s,l,e,t,n,i)}function kc(s,e,t,n,i,r=.055){let o=Va(s,e,t,.035,n,i,r);return o.rotation.x=-Math.PI/2,o.castShadow=!1,o}function Oc(s,e,t,n=.15){let i=new gs(t.map(o=>new F(...o))),r=new fr(i,Math.max(12,t.length*6),n,6,!1);return Hi(s,r,e,0,0,0)}function Tr(s,e,t,n,i,r=3,o=.7,l=J.paper,h=J.ink){let u=document.createElement("canvas");u.width=512,u.height=Math.max(64,Math.round(512*o/r));let a=u.getContext("2d");a.fillStyle=l,a.fillRect(0,0,u.width,u.height),a.fillStyle=h,a.textAlign="center",a.textBaseline="middle",a.font=`800 ${Math.round(u.height*.63)}px Arial`,a.fillText(e,256,u.height*.52,480);let c=new ms(u);c.colorSpace=Ct;let d=new Ht({map:c,side:Ft});return Hi(s,xd(),d,t,n,i,r,o,1)}function Es(s){s.updateWorldMatrix(!0,!0);let e=s.matrixWorld.clone().invert(),t=new Map;s.traverse(n=>{if(!n.isMesh)return;let i=n.material,r=i.uuid;t.has(r)||t.set(r,{material:i,geos:[]});let o=new rt().multiplyMatrices(e,n.matrixWorld),l=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();t.get(r).geos.push(l.applyMatrix4(o))}),s.clear();for(let{material:n,geos:i}of t.values()){let r=gd(i,!1);i.forEach(l=>l.dispose());let o=new ht(r,n);o.castShadow=!0,o.receiveShadow=!0,s.add(o)}return s}function n_(s,e,t,n){pt(s,J.dark,e,t,n,.075,.07),Fe(s,J.paper,e,t+.039,n,.06,.009,.013)}function i_(s,e,t,n=1){pt(s,J.coral,e,.27,t,.55*n,.5),pt(s,"#455c47",e,.54,t,.44*n,.03);for(let i=0;i<4;i++){let r=i*2.4,o=pt(s,"#618263",e+Math.cos(r)*.15,.9+i*.09,t+Math.sin(r)*.15,.045,.8);o.rotation.z=Math.sin(r)*.28;let l=mi(s,i%2?"#91ad72":"#6c976c",e+Math.cos(r)*.32,1.25+i*.09,t+Math.sin(r)*.32,.29*n);l.scale.y*=1.65,l.rotation.z=r*.3}}function s_(s,e){Fe(s,J.metal,e.x,.58,e.z,e.w*.92,1.15,e.d*.92),Fe(s,J.paper,e.x,1.18,e.z,e.w*.87,.16,e.d*.87);for(let n of[-.34,.34])Fe(s,J.yellow,e.x+e.w*n,.69,e.z,e.w*.07,1.35,e.d*.98);let t=Tr(s,"CAUTION",e.x,.55,e.z+e.d*.465,Math.min(1.65,e.w*.65),.3,J.yellow);t.rotation.y=0}function r_(s,e,t){let n=Math.min(e.w,e.d)*.4;Fe(s,J.dark,e.x,.2,e.z,e.w,.4,e.d);let i=e.d>4?2:1;for(let r=0;r<i;r++){let o=e.z+(r-(i-1)/2)*e.d*.46;pt(s,J.paper,e.x,1.2,o,n,2.1),pt(s,J.blue,e.x,.36,o,n*1.05,.18),pt(s,J.blue,e.x,2.18,o,n*1.03,.18);let l=mi(s,J.mint,e.x,2.24,o,n*.86);l.scale.y=.33;for(let u=0;u<4;u++)Fe(s,J.dark,e.x-n*.68+u*n*.45,1.1,o+n*.96,.12,.8,.075);Oc(s,J.coral,[[e.x+n*.7,2.2,o],[e.x+n*1.1,2.5,o],[e.x+n*1.35,1.6,o],[e.x+n*1.35,.2,o]],.1);let h=new ct;h.position.set(e.x,2.52,o),pt(h,J.dark,0,0,0,.16,.18);for(let u=0;u<4;u++){let a=Fe(h,J.blue,Math.sin(u*Math.PI/2)*n*.4,0,Math.cos(u*Math.PI/2)*n*.4,n*.6,.045,.22);a.rotation.y=-u*Math.PI/2}Es(h),t.add(h),h.userData.spin=.7}}function o_(s,e,t){Fe(s,J.paper,e.x,.2,e.z,e.w,.4,e.d),Fe(s,J.blue,e.x,1,e.z,e.w*.9,1.7,e.d*.83),pt(s,J.yellow,e.x,1.91,e.z,1.65,.22),pt(s,J.dark,e.x,2.05,e.z,1.38,.18);let n=new ct;n.position.set(e.x,2.2,e.z),pt(n,J.paper,0,0,0,.4,.3);for(let r=0;r<6;r++){let o=r*Math.PI/3,l=Fe(n,J.mint,Math.sin(o)*.8,0,Math.cos(o)*.8,.6,.15,.9);l.rotation.y=o+.4}Es(n),t.add(n),n.userData.spin=.6;let i=Tr(s,"O\u2014Y / POWER WORKS",e.x,1,e.z+e.d*.422,3,.55);i.rotation.y=0;for(let r=0;r<3;r++)pt(s,J.dark,e.x-1.6+r*.42,1.9,e.z-1.1,.11,.45)}function _d(s){let e=new ct,t=new ct,n=new ct;e.add(t,n);let i=t;Fe(i,J.dark,0,-1.75,0,28.1,.65,24.1),Fe(i,s.edge,0,-.95,0,28,1.1,24),Fe(i,s.color,0,-.18,0,28.15,.42,24.15);for(let h=-12;h<=12;h+=3)Fe(i,J.dark,h,-1.06,12.01,1.5,.6,.08),Fe(i,J.paper,h,-.92,12.08,.09,.3,.03);for(let h=-9;h<=9;h+=3)Fe(i,J.dark,14.01,-1,h,.08,.6,1.2);Fe(i,"#cbd0af",-10,.045,0,2.6,.035,21),Fe(i,"#cbd0af",0,.046,8,24,.03,2.6),Fe(i,"#cbd0af",10,.047,-2,2.6,.03,16);for(let h=-10;h<=10;h+=1.4)Fe(i,J.paper,-8.55,.07,h,.06,.025,.55);for(let h=-12;h<=12;h+=1.4)Fe(i,J.paper,h,.07,6.55,.55,.025,.06);for(let h=-7;h<=7;h+=7)Fe(i,"#8fa48e",h,.047,-1,.018,.016,20);for(let h=-12;h<=12;h+=4)for(let u of[-11.5,11.5])Fe(i,J.dark,h,.19,u,.42,.35,.4),Fe(i,J.yellow,h,.4,u,.38,.08,.36),n_(i,h,.05,u+.65);for(let h of[-13.5,13.5])for(let u=-8;u<=8;u+=4)pt(i,J.paper,h,.25,u,.11,.55),mi(i,J.yellow,h,.6,u,.12);Oc(i,J.blue,[[-12,-.4,12.3],[-8,-.4,12.4],[-7,-.9,12.4],[-1,-.9,12.4],[0,-.4,12.4],[8,-.4,12.4]],.12),Oc(i,J.coral,[[14.3,-.1,-8],[14.4,-.1,-3],[14.4,-1.3,-1],[14.4,-1.3,7]],.17);for(let h of s.obstacles)h.type==="tank"?r_(i,h,n):h.type==="turbine"?o_(i,h,n):s_(i,h);let r=Tr(i,`SKIFT / ${s.number}`,0,-.94,12.105,4,.75,J.paper);r.rotation.y=0;let o=Tr(i,s.number,-5,.085,-3,3.1,2.1,s.color,s.edge);o.rotation.x=-Math.PI/2;for(let[h,u]of[[-12.5,-10.5],[12.4,10.3],[-12.7,10.6],[12.2,-10.7]])i_(i,h,u,.8);let l=Va(i,J.coral,-11,2.2,-12.6,1.55,.24);l.rotation.y=.3,pt(i,J.dark,-11,.4,-12.6,.75,.7);for(let h of s.hazards){Fe(i,J.dark,h.x,.06,h.z,h.w+.25,.12,h.d+.3);for(let u=h.x-h.w/2;u<h.x+h.w/2;u+=.6){let a=Fe(i,J.yellow,u,.14,h.z,.25,.015,h.d+.24);a.rotation.y=.45}}return Es(t),{root:e,staticArt:t,dynamicArt:n}}function vd(s,e=1.35){let t="blob";if(!Ts.has(t)){let i=document.createElement("canvas");i.width=i.height=64;let r=i.getContext("2d"),o=r.createRadialGradient(32,32,2,32,32,31);o.addColorStop(0,"rgba(23,39,34,.32)"),o.addColorStop(1,"rgba(23,39,34,0)"),r.fillStyle=o,r.fillRect(0,0,64,64);let l=new Ht({map:new ms(i),transparent:!0,depthWrite:!1});l.userData.shared=!0,Ts.set(t,l)}let n=Hi(s,xd(),Ts.get(t),0,.065,0,e,e,1);return n.rotation.x=-Math.PI/2,n.castShadow=!1,n}function yd(){let s=new ct,e=new ct;s.add(e),Fe(e,J.blue,0,.8,0,.84,.9,.7),mi(e,J.paper,0,1.08,.02,.43).scale.y=.57,Fe(e,J.dark,0,.97,.353,.65,.29,.08);for(let n of[-.18,.18])Fe(e,hn("#dcfcf0",!0),n,.99,.403,.13,.065,.03);Fe(e,J.yellow,0,.75,.38,.15,.12,.045),Fe(e,J.coral,0,.77,-.41,.52,.6,.2);for(let n of[-.53,.53])mi(e,J.paper,n,.75,0,.16),Fe(e,J.blue,n,.5,.04,.21,.3,.22);for(let n of[-.33,.33]){let i=pt(e,J.dark,n,.23,0,.25,.19);i.rotation.z=Math.PI/2;let r=pt(e,J.paper,n+(n<0?-.11:.11),.23,0,.11,.02);r.rotation.z=Math.PI/2}pt(e,J.dark,.22,1.45,-.08,.025,.58),mi(e,hn(J.yellow,!0),.22,1.76,-.08,.105),Es(e),s.userData.body=e,vd(s),s.traverse(n=>{n.isMesh&&(n.castShadow=!1)});let t=kc(s,J.blue,0,0,.67,.035);return s.userData.halo=t,s}function bd(s){let e=new ct,t=new ct;e.add(t);let n=s==="shooter"?J.yellow:s==="charger"?J.coral:"#d97157",i=s==="charger"?1.15:.9;pt(t,J.dark,0,.3,0,.42*i,.2),mi(t,n,0,.77,0,.54*i).scale.y=.8,Fe(t,J.dark,0,.84,.45*i,.67*i,.2,.09),Fe(t,hn("#fff0ca",!0),0,.84,.52*i,s==="charger"?.4:.18,.07,.02);for(let r of[-.54,.54])Fe(t,J.dark,r*i,.55,0,.17,.17,.68);if(s==="shooter"){let r=pt(t,J.dark,0,.83,.65,.095,.5);r.rotation.x=Math.PI/2}if(s==="charger")for(let r of[-.35,.35])Fe(t,J.paper,r,1.16,.3,.13,.35,.12);return Es(t),e.userData.body=t,vd(e,1.5),e.traverse(r=>{r.isMesh&&(r.castShadow=!1)}),e}function wd(){let s=new ct;pt(s,J.dark,0,.14,0,.55,.22),kc(s,J.blue,0,0,.76,.065);let e=new ct;return e.position.y=.4,s.add(e),Fe(e,J.blue,0,.5,0,.55,.8,.55),Fe(e,J.paper,0,.94,0,.42,.08,.42),Fe(e,hn(J.yellow,!0),0,.5,.3,.2,.42,.028),Fe(e,J.paper,0,.09,0,.42,.08,.42),Es(e),s.userData.body=e,s}function Md(){let s=new ct,e=Va(s,J.yellow,0,.6,0,.18,.07);return s.userData.body=e,s}function Sd(){let s=new ct;pt(s,J.dark,0,.08,0,1.3,.14),pt(s,J.paper,0,.18,0,1.08,.1);let e=kc(s,J.blue,0,0,1.5,.07);for(let n of[-1.35,1.35])Fe(s,J.blue,n,1.1,0,.22,2.2,.24),Fe(s,J.paper,n,1.15,.145,.06,1.6,.025);Fe(s,J.blue,0,2.18,0,2.85,.26,.24);let t=Tr(s,"\u2192",0,2.19,.14,1.15,.6,J.yellow);return s.userData.ring=e,s.userData.flag=t,s}function Ad(){let s=new ct,e=new ct;s.add(e),pt(s,J.dark,0,.35,0,1.75,.65),pt(s,J.paper,0,.71,0,1.64,.12);let t=mi(s,hn(J.coral,!0),0,1.85,0,.88);s.userData.core=t;for(let n=0;n<3;n++)Va(e,n===1?J.yellow:J.blue,0,1.85,0,1.15+n*.23,.13).rotation.set(n*.8+.35,n*1.1,.35);for(let n=0;n<4;n++){let i=n*Math.PI/2;Fe(s,J.blue,Math.sin(i)*1.45,1.25,Math.cos(i)*1.45,.45,2.3,.45)}return s.userData.rotor=e,s}function Td(s){let e=new Set,t=new Set;s.traverse(n=>{n.geometry&&!n.geometry.userData.shared&&e.add(n.geometry),n.material&&!n.material.userData.shared&&t.add(n.material)}),e.forEach(n=>n.dispose()),t.forEach(n=>{n.map?.dispose(),n.dispose()}),s.clear()}var Ha=class{constructor(e,t){this.container=e,this.settings=t,this.renderer=new za({antialias:!0,alpha:!1,powerPreference:"low-power"}),this.renderer.outputColorSpace=Ct,this.renderer.toneMapping=Zo,this.renderer.toneMappingExposure=1.35,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Vo,this.renderer.shadowMap.autoUpdate=!1,e.append(this.renderer.domElement),this.renderer.domElement.setAttribute("aria-label","SKIFT \u2014 spelv\xE4rld"),this.scene=new sr,this.camera=new Di(-20,20,15,-15,.1,150),this.target=new F,this.offset=new F(22,29,22),this.projected=new F,this.scene.add(new gr("#fff5de","#607883",2.3));let n=new xr("#fff3d6",3.2);n.position.set(-12,25,16),n.castShadow=!0,n.shadow.mapSize.set(1024,1024),Object.assign(n.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:65}),n.shadow.bias=-5e-4,n.shadow.normalBias=.04,n.shadow.radius=3,this.scene.add(n),this.sun=n,this.ground=new ht(new Xn(200,200),new Li({color:"#e9e2d1",roughness:1})),this.ground.rotation.x=-Math.PI/2,this.ground.position.y=-2.2,this.ground.receiveShadow=!0,this.scene.add(this.ground),this.scene.fog=new ir("#e9e2d1",65,120),this.world=null,this.hero=null,this.time=0,this.shake=0,this.mode="menu",this.particleData=[];let i=new ur(.11);this.particles=new rr(i,new Ht({color:"#ffffff"}),64),this.particles.instanceMatrix.setUsage(fc),this.particles.frustumCulled=!1,this.particles.count=0,this.scene.add(this.particles),this.matrix=new Et,this.tempColor=new He,this.rings=[];for(let r=0;r<8;r++){let o=new ht(new Ii(.94,1,64),new Ht({color:J.blue,transparent:!0,opacity:.8,side:Ft,depthWrite:!1}));o.rotation.x=-Math.PI/2,o.visible=!1,this.scene.add(o),this.rings.push({mesh:o,life:0})}this.resize()}resize(){if(this.width=this.container.clientWidth,this.height=this.container.clientHeight,!this.width||!this.height)return;let e=this.settings.quality==="smooth"?17e5:1e6,t=Math.min(this.settings.quality==="smooth"?1.4:1,Math.sqrt(e/(this.width*this.height)));this.renderer.setPixelRatio(t),this.renderer.setSize(this.width,this.height,!1),this.setCamera(this.mode,!0)}setCamera(e,t=!1,n=null,i=1/30){let r=this.width/this.height,o=r<.95,l=e==="menu"?o?53:36:o?31:25;this.camera.left=-l*r/2,this.camera.right=l*r/2,this.camera.top=l/2,this.camera.bottom=-l/2,this.camera.updateProjectionMatrix();let h=0,u=0,a=0;e==="menu"?(h=o?-.5:-7,u=o?.5:7,a=o?7:0):n&&(h=Math.max(-8,Math.min(8,n.x*.76)),u=Math.max(-6,Math.min(6,n.z*.76)));let c=new F(h,a,u);t?this.target.copy(c):this.target.lerp(c,1-Math.exp(-i*5)),this.camera.position.copy(this.target).add(this.offset),this.settings.motion&&this.shake>0&&(this.camera.position.x+=Math.sin(this.time*73)*this.shake,this.camera.position.z+=Math.cos(this.time*53)*this.shake),this.camera.lookAt(this.target)}load(e){this.world&&(this.scene.remove(this.world),Td(this.world)),this.level=e,this.world=new ct,this.scene.add(this.world);let t=_d(e);this.world.add(t.root),this.dynamic=t.dynamicArt,this.dynamic.traverse(i=>{i.isMesh&&(i.castShadow=!1)}),this.hero=yd(),this.hero.position.set(e.start[0],0,e.start[1]),this.world.add(this.hero),this.cellModels=e.cells.map(([i,r])=>{let o=wd();return o.position.set(i,0,r),this.world.add(o),o}),this.scrapModels=e.scrap.map(([i,r])=>{let o=Md();return o.position.set(i,0,r),this.world.add(o),o}),this.exit=Sd(),this.exit.position.set(e.exit[0],0,e.exit[1]),this.world.add(this.exit),this.boss=e.boss?Ad():null,this.boss&&(this.boss.position.set(e.boss[0],0,e.boss[1]),this.world.add(this.boss)),this.enemyModels=[],this.telegraphs=[],this.bulletModels=[];let n=new Pi(.15,8,6);for(let i=0;i<32;i++){let r=new ht(n,hn(J.coral,!0));r.visible=!1,this.world.add(r),this.bulletModels.push(r)}this.hazardModels=e.hazards.map(i=>{let r=new ht(new vn(i.w,.11,i.d),new Ht({color:"#f08b51",transparent:!0,opacity:.3}));return r.position.set(i.x,.22,i.z),this.world.add(r),r}),this.bossRing=new ht(new Ii(.975,1,80),new Ht({color:"#e76441",transparent:!0,opacity:.8,side:Ft,depthWrite:!1})),this.bossRing.rotation.x=-Math.PI/2,this.bossRing.visible=!1,this.world.add(this.bossRing),this.particleData.length=0,this.rings.forEach(i=>{i.life=0,i.mesh.visible=!1}),this.ground.material.color.set(e.ground),this.scene.background=new He(e.ground),this.scene.fog.color.set(e.ground),this.renderer.shadowMap.needsUpdate=!0,this.mode="menu",this.setCamera("menu",!0)}addEnemy(e){let t=bd(e.type);t.position.set(e.body.position.x,0,e.body.position.z),this.world.add(t),e.visual=t;let n=new ht(new Ii(.91,1,40),new Ht({color:"#d24d29",transparent:!0,opacity:0,side:Ft,depthWrite:!1}));n.rotation.x=-Math.PI/2,this.world.add(n),e.tell=n,this.enemyModels.push(t);let i=new ht(new vn(.07,.015,5),new Ht({color:"#d45c31",transparent:!0,opacity:.45,depthWrite:!1}));i.visible=!1,this.world.add(i),e.beam=i}burst(e,t,n=J.yellow,i=12){this.settings.motion||(i=Math.min(i,4));for(let r=0;r<i&&this.particleData.length<64;r++){let o=Math.random()*Math.PI*2,l=1+Math.random()*3;this.particleData.push({x:e,y:.7,z:t,vx:Math.cos(o)*l,vz:Math.sin(o)*l,vy:2+Math.random()*3,life:.35+Math.random()*.35,color:n})}}wave(e,t,n=J.blue,i=3.5,r=.45){let o=this.rings.find(l=>l.life<=0)||this.rings[0];Object.assign(o,{life:r,max:r,radius:i}),o.mesh.position.set(e,.08,t),o.mesh.material.color.set(n),o.mesh.visible=!0,o.mesh.scale.setScalar(.1)}draw(e,t,n,i){this.time=i,this.mode=t;let r=t==="play",o=r||t==="menu",l=e?.state,h=e?.player?.position;if(this.shake=Math.max(0,this.shake-n*1.5),this.setCamera(t==="menu"?"menu":"play",!1,h,n),o&&this.settings.motion)for(let u of this.dynamic.children)u.rotation.y+=n*(u.userData.spin||0);if(e){this.hero.position.set(h.x,0,h.z);let u=this.hero.userData.body,a=gc.euclideanModulo(e.facing-this.hero.rotation.y+Math.PI,Math.PI*2)-Math.PI;this.hero.rotation.y+=a*(1-Math.exp(-n*18)),this.settings.motion?(u.position.y=e.moving?Math.abs(Math.sin(i*19))*.075:Math.sin(i*3)*.026,u.rotation.x=l.dashing>0?-.18:0):(u.position.y=0,u.rotation.x=0),u.visible=!0;let c=r&&l.invulnerable>0&&this.settings.motion&&Math.floor(i*8)%2===0;this.hero.userData.halo.material=hn(c?J.coral:J.blue),l.dashing>0&&this.settings.motion&&Math.random()>.3&&this.burst(h.x,h.z,J.blue,1);for(let f=0;f<this.cellModels.length;f++){let m=this.cellModels[f];m.visible=!l.cells.has(`cell-${f}`),o&&this.settings.motion&&(m.userData.body.rotation.y=i*.9+f,m.userData.body.position.y=.4+Math.sin(i*2+f)*.08)}for(let f=0;f<this.scrapModels.length;f++){let m=this.scrapModels[f];m.visible=!e.scrap.has(f),this.settings.motion&&(m.rotation.y=i*1.8+f)}for(let f of e.enemies){if(f.dead){f.visual.visible=!1,f.tell.visible=!1,f.beam.visible=!1;continue}f.visual.position.set(f.body.position.x,0,f.body.position.z),f.visual.rotation.y=f.facing||0,f.visual.userData.body.position.y=this.settings.motion?Math.sin(i*4+f.seed)*.045:0,f.tell.visible=f.telegraph>0,f.tell.material.opacity=f.telegraph>0?.25+.5*(1-f.telegraph/.9):0,f.tell.position.set(f.body.position.x,.09,f.body.position.z),f.tell.scale.setScalar(f.type==="charger"?1.2:1),f.beam.visible=f.telegraph>0,f.beam.position.set(f.body.position.x+f.aim.x*2.5,.11,f.body.position.z+f.aim.z*2.5),f.beam.rotation.y=Math.atan2(f.aim.x,f.aim.z),f.telegraph>0&&(f.visual.rotation.y=f.beam.rotation.y),f.stunned>0?f.visual.rotation.z=Math.sin(i*27)*.13:f.visual.rotation.z=0}for(let f=0;f<this.bulletModels.length;f++){let m=this.bulletModels[f],x=e.bullets[f];m.visible=!!x,x&&(m.position.set(x.x,.65,x.z),m.material=hn(x.friendly?J.blue:J.coral,!0))}for(let f=0;f<this.hazardModels.length;f++){let m=e.hazardActive(f),x=this.hazardModels[f];x.material.opacity=m?.8:.13,x.scale.y=m?6:1}let d=l.cells.size===3&&(!e.bossState||l.bossDefeated);if(this.exit.userData.ring.material=hn(d?J.blue:J.metal,!0),this.settings.motion&&this.exit.userData.ring.scale.setScalar(d?1+Math.sin(i*3)*.08:1),this.boss){let f=e.bossState;this.boss.visible=!l.bossDefeated,this.settings.motion&&(this.boss.userData.rotor.rotation.y=i*(f?.vulnerable>0?2:.55)),this.boss.userData.core.material=hn(f?.vulnerable>0?J.yellow:J.coral,!0),this.bossRing.visible=(!!f?.waveRadius||f?.active&&f.timer<1)&&!l.bossDefeated,this.bossRing.visible&&(this.bossRing.position.set(f.x,.1,f.z),this.bossRing.scale.setScalar(f.waveRadius||2+(1-f.timer)*1.2))}}for(let u=this.particleData.length-1;u>=0;u--){let a=this.particleData[u];if(a.life-=n,a.life<=0){this.particleData.splice(u,1);continue}a.x+=a.vx*n,a.z+=a.vz*n,a.y+=a.vy*n,a.vy-=13*n}this.particles.count=this.particleData.length;for(let u=0;u<this.particleData.length;u++){let a=this.particleData[u];this.matrix.position.set(a.x,Math.max(.08,a.y),a.z),this.matrix.scale.setScalar(Math.min(1,a.life*6)),this.matrix.rotation.set(a.life*3,a.life*7,0),this.matrix.updateMatrix(),this.particles.setMatrixAt(u,this.matrix.matrix),this.particles.setColorAt(u,this.tempColor.set(a.color))}this.particles.instanceMatrix.needsUpdate=!0,this.particles.instanceColor&&(this.particles.instanceColor.needsUpdate=!0);for(let u of this.rings)u.life=Math.max(0,u.life-n),u.mesh.visible=u.life>0,u.life>0&&(u.mesh.scale.setScalar((1-u.life/u.max)*u.radius+.1),u.mesh.material.opacity=u.life/u.max*.8);this.renderer.render(this.scene,this.camera)}project(e,t,n=1){return this.projected.set(e,n,t).project(this.camera),{x:(this.projected.x*.5+.5)*this.width,y:(-.5*this.projected.y+.5)*this.height}}stats(){let e=this.renderer.info;return{drawCalls:e.render.calls,triangles:e.render.triangles,geometries:e.memory.geometries,textures:e.memory.textures,width:this.renderer.domElement.width,height:this.renderer.domElement.height,pixelRatio:this.renderer.getPixelRatio()}}};var xi=class s{constructor(e){e===void 0&&(e=[0,0,0,0,0,0,0,0,0]),this.elements=e}identity(){let e=this.elements;e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1}setZero(){let e=this.elements;e[0]=0,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=0,e[6]=0,e[7]=0,e[8]=0}setTrace(e){let t=this.elements;t[0]=e.x,t[4]=e.y,t[8]=e.z}getTrace(e){e===void 0&&(e=new S);let t=this.elements;return e.x=t[0],e.y=t[4],e.z=t[8],e}vmult(e,t){t===void 0&&(t=new S);let n=this.elements,i=e.x,r=e.y,o=e.z;return t.x=n[0]*i+n[1]*r+n[2]*o,t.y=n[3]*i+n[4]*r+n[5]*o,t.z=n[6]*i+n[7]*r+n[8]*o,t}smult(e){for(let t=0;t<this.elements.length;t++)this.elements[t]*=e}mmult(e,t){t===void 0&&(t=new s);let n=this.elements,i=e.elements,r=t.elements,o=n[0],l=n[1],h=n[2],u=n[3],a=n[4],c=n[5],d=n[6],f=n[7],m=n[8],x=i[0],p=i[1],g=i[2],_=i[3],y=i[4],v=i[5],T=i[6],A=i[7],C=i[8];return r[0]=o*x+l*_+h*T,r[1]=o*p+l*y+h*A,r[2]=o*g+l*v+h*C,r[3]=u*x+a*_+c*T,r[4]=u*p+a*y+c*A,r[5]=u*g+a*v+c*C,r[6]=d*x+f*_+m*T,r[7]=d*p+f*y+m*A,r[8]=d*g+f*v+m*C,t}scale(e,t){t===void 0&&(t=new s);let n=this.elements,i=t.elements;for(let r=0;r!==3;r++)i[3*r+0]=e.x*n[3*r+0],i[3*r+1]=e.y*n[3*r+1],i[3*r+2]=e.z*n[3*r+2];return t}solve(e,t){t===void 0&&(t=new S);let n=3,i=4,r=[],o,l;for(o=0;o<n*i;o++)r.push(0);for(o=0;o<3;o++)for(l=0;l<3;l++)r[o+i*l]=this.elements[o+3*l];r[3]=e.x,r[7]=e.y,r[11]=e.z;let h=3,u=h,a,c=4,d;do{if(o=u-h,r[o+i*o]===0){for(l=o+1;l<u;l++)if(r[o+i*l]!==0){a=c;do d=c-a,r[d+i*o]+=r[d+i*l];while(--a);break}}if(r[o+i*o]!==0)for(l=o+1;l<u;l++){let f=r[o+i*l]/r[o+i*o];a=c;do d=c-a,r[d+i*l]=d<=o?0:r[d+i*l]-r[d+i*o]*f;while(--a)}}while(--h);if(t.z=r[2*i+3]/r[2*i+2],t.y=(r[1*i+3]-r[1*i+2]*t.z)/r[1*i+1],t.x=(r[0*i+3]-r[0*i+2]*t.z-r[0*i+1]*t.y)/r[0*i+0],isNaN(t.x)||isNaN(t.y)||isNaN(t.z)||t.x===1/0||t.y===1/0||t.z===1/0)throw`Could not solve equation! Got x=[${t.toString()}], b=[${e.toString()}], A=[${this.toString()}]`;return t}e(e,t,n){if(n===void 0)return this.elements[t+3*e];this.elements[t+3*e]=n}copy(e){for(let t=0;t<e.elements.length;t++)this.elements[t]=e.elements[t];return this}toString(){let e="";for(let n=0;n<9;n++)e+=this.elements[n]+",";return e}reverse(e){e===void 0&&(e=new s);let t=3,n=6,i=a_,r,o;for(r=0;r<3;r++)for(o=0;o<3;o++)i[r+n*o]=this.elements[r+3*o];i[3]=1,i[9]=0,i[15]=0,i[4]=0,i[10]=1,i[16]=0,i[5]=0,i[11]=0,i[17]=1;let l=3,h=l,u,a=n,c;do{if(r=h-l,i[r+n*r]===0){for(o=r+1;o<h;o++)if(i[r+n*o]!==0){u=a;do c=a-u,i[c+n*r]+=i[c+n*o];while(--u);break}}if(i[r+n*r]!==0)for(o=r+1;o<h;o++){let d=i[r+n*o]/i[r+n*r];u=a;do c=a-u,i[c+n*o]=c<=r?0:i[c+n*o]-i[c+n*r]*d;while(--u)}}while(--l);r=2;do{o=r-1;do{let d=i[r+n*o]/i[r+n*r];u=n;do c=n-u,i[c+n*o]=i[c+n*o]-i[c+n*r]*d;while(--u)}while(o--)}while(--r);r=2;do{let d=1/i[r+n*r];u=n;do c=n-u,i[c+n*r]=i[c+n*r]*d;while(--u)}while(r--);r=2;do{o=2;do{if(c=i[t+o+n*r],isNaN(c)||c===1/0)throw`Could not reverse! A=[${this.toString()}]`;e.e(r,o,c)}while(o--)}while(r--);return e}setRotationFromQuaternion(e){let t=e.x,n=e.y,i=e.z,r=e.w,o=t+t,l=n+n,h=i+i,u=t*o,a=t*l,c=t*h,d=n*l,f=n*h,m=i*h,x=r*o,p=r*l,g=r*h,_=this.elements;return _[0]=1-(d+m),_[1]=a-g,_[2]=c+p,_[3]=a+g,_[4]=1-(u+m),_[5]=f-x,_[6]=c-p,_[7]=f+x,_[8]=1-(u+d),this}transpose(e){e===void 0&&(e=new s);let t=this.elements,n=e.elements,i;return n[0]=t[0],n[4]=t[4],n[8]=t[8],i=t[1],n[1]=t[3],n[3]=i,i=t[2],n[2]=t[6],n[6]=i,i=t[5],n[5]=t[7],n[7]=i,e}},a_=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],S=class s{constructor(e,t,n){e===void 0&&(e=0),t===void 0&&(t=0),n===void 0&&(n=0),this.x=e,this.y=t,this.z=n}cross(e,t){t===void 0&&(t=new s);let n=e.x,i=e.y,r=e.z,o=this.x,l=this.y,h=this.z;return t.x=l*r-h*i,t.y=h*n-o*r,t.z=o*i-l*n,t}set(e,t,n){return this.x=e,this.y=t,this.z=n,this}setZero(){this.x=this.y=this.z=0}vadd(e,t){if(t)t.x=e.x+this.x,t.y=e.y+this.y,t.z=e.z+this.z;else return new s(this.x+e.x,this.y+e.y,this.z+e.z)}vsub(e,t){if(t)t.x=this.x-e.x,t.y=this.y-e.y,t.z=this.z-e.z;else return new s(this.x-e.x,this.y-e.y,this.z-e.z)}crossmat(){return new xi([0,-this.z,this.y,this.z,0,-this.x,-this.y,this.x,0])}normalize(){let e=this.x,t=this.y,n=this.z,i=Math.sqrt(e*e+t*t+n*n);if(i>0){let r=1/i;this.x*=r,this.y*=r,this.z*=r}else this.x=0,this.y=0,this.z=0;return i}unit(e){e===void 0&&(e=new s);let t=this.x,n=this.y,i=this.z,r=Math.sqrt(t*t+n*n+i*i);return r>0?(r=1/r,e.x=t*r,e.y=n*r,e.z=i*r):(e.x=1,e.y=0,e.z=0),e}length(){let e=this.x,t=this.y,n=this.z;return Math.sqrt(e*e+t*t+n*n)}lengthSquared(){return this.dot(this)}distanceTo(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,l=e.z;return Math.sqrt((r-t)*(r-t)+(o-n)*(o-n)+(l-i)*(l-i))}distanceSquared(e){let t=this.x,n=this.y,i=this.z,r=e.x,o=e.y,l=e.z;return(r-t)*(r-t)+(o-n)*(o-n)+(l-i)*(l-i)}scale(e,t){t===void 0&&(t=new s);let n=this.x,i=this.y,r=this.z;return t.x=e*n,t.y=e*i,t.z=e*r,t}vmul(e,t){return t===void 0&&(t=new s),t.x=e.x*this.x,t.y=e.y*this.y,t.z=e.z*this.z,t}addScaledVector(e,t,n){return n===void 0&&(n=new s),n.x=this.x+e*t.x,n.y=this.y+e*t.y,n.z=this.z+e*t.z,n}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}isZero(){return this.x===0&&this.y===0&&this.z===0}negate(e){return e===void 0&&(e=new s),e.x=-this.x,e.y=-this.y,e.z=-this.z,e}tangents(e,t){let n=this.length();if(n>0){let i=l_,r=1/n;i.set(this.x*r,this.y*r,this.z*r);let o=c_;Math.abs(i.x)<.9?(o.set(1,0,0),i.cross(o,e)):(o.set(0,1,0),i.cross(o,e)),i.cross(e,t)}else e.set(1,0,0),t.set(0,1,0)}toString(){return`${this.x},${this.y},${this.z}`}toArray(){return[this.x,this.y,this.z]}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}lerp(e,t,n){let i=this.x,r=this.y,o=this.z;n.x=i+(e.x-i)*t,n.y=r+(e.y-r)*t,n.z=o+(e.z-o)*t}almostEquals(e,t){return t===void 0&&(t=1e-6),!(Math.abs(this.x-e.x)>t||Math.abs(this.y-e.y)>t||Math.abs(this.z-e.z)>t)}almostZero(e){return e===void 0&&(e=1e-6),!(Math.abs(this.x)>e||Math.abs(this.y)>e||Math.abs(this.z)>e)}isAntiparallelTo(e,t){return this.negate(Ed),Ed.almostEquals(e,t)}clone(){return new s(this.x,this.y,this.z)}};S.ZERO=new S(0,0,0);S.UNIT_X=new S(1,0,0);S.UNIT_Y=new S(0,1,0);S.UNIT_Z=new S(0,0,1);var l_=new S,c_=new S,Ed=new S,tn=class s{constructor(e){e===void 0&&(e={}),this.lowerBound=new S,this.upperBound=new S,e.lowerBound&&this.lowerBound.copy(e.lowerBound),e.upperBound&&this.upperBound.copy(e.upperBound)}setFromPoints(e,t,n,i){let r=this.lowerBound,o=this.upperBound,l=n;r.copy(e[0]),l&&l.vmult(r,r),o.copy(r);for(let h=1;h<e.length;h++){let u=e[h];l&&(l.vmult(u,Cd),u=Cd),u.x>o.x&&(o.x=u.x),u.x<r.x&&(r.x=u.x),u.y>o.y&&(o.y=u.y),u.y<r.y&&(r.y=u.y),u.z>o.z&&(o.z=u.z),u.z<r.z&&(r.z=u.z)}return t&&(t.vadd(r,r),t.vadd(o,o)),i&&(r.x-=i,r.y-=i,r.z-=i,o.x+=i,o.y+=i,o.z+=i),this}copy(e){return this.lowerBound.copy(e.lowerBound),this.upperBound.copy(e.upperBound),this}clone(){return new s().copy(this)}extend(e){this.lowerBound.x=Math.min(this.lowerBound.x,e.lowerBound.x),this.upperBound.x=Math.max(this.upperBound.x,e.upperBound.x),this.lowerBound.y=Math.min(this.lowerBound.y,e.lowerBound.y),this.upperBound.y=Math.max(this.upperBound.y,e.upperBound.y),this.lowerBound.z=Math.min(this.lowerBound.z,e.lowerBound.z),this.upperBound.z=Math.max(this.upperBound.z,e.upperBound.z)}overlaps(e){let t=this.lowerBound,n=this.upperBound,i=e.lowerBound,r=e.upperBound,o=i.x<=n.x&&n.x<=r.x||t.x<=r.x&&r.x<=n.x,l=i.y<=n.y&&n.y<=r.y||t.y<=r.y&&r.y<=n.y,h=i.z<=n.z&&n.z<=r.z||t.z<=r.z&&r.z<=n.z;return o&&l&&h}volume(){let e=this.lowerBound,t=this.upperBound;return(t.x-e.x)*(t.y-e.y)*(t.z-e.z)}contains(e){let t=this.lowerBound,n=this.upperBound,i=e.lowerBound,r=e.upperBound;return t.x<=i.x&&n.x>=r.x&&t.y<=i.y&&n.y>=r.y&&t.z<=i.z&&n.z>=r.z}getCorners(e,t,n,i,r,o,l,h){let u=this.lowerBound,a=this.upperBound;e.copy(u),t.set(a.x,u.y,u.z),n.set(a.x,a.y,u.z),i.set(u.x,a.y,a.z),r.set(a.x,u.y,a.z),o.set(u.x,a.y,u.z),l.set(u.x,u.y,a.z),h.copy(a)}toLocalFrame(e,t){let n=Rd,i=n[0],r=n[1],o=n[2],l=n[3],h=n[4],u=n[5],a=n[6],c=n[7];this.getCorners(i,r,o,l,h,u,a,c);for(let d=0;d!==8;d++){let f=n[d];e.pointToLocal(f,f)}return t.setFromPoints(n)}toWorldFrame(e,t){let n=Rd,i=n[0],r=n[1],o=n[2],l=n[3],h=n[4],u=n[5],a=n[6],c=n[7];this.getCorners(i,r,o,l,h,u,a,c);for(let d=0;d!==8;d++){let f=n[d];e.pointToWorld(f,f)}return t.setFromPoints(n)}overlapsRay(e){let{direction:t,from:n}=e,i=1/t.x,r=1/t.y,o=1/t.z,l=(this.lowerBound.x-n.x)*i,h=(this.upperBound.x-n.x)*i,u=(this.lowerBound.y-n.y)*r,a=(this.upperBound.y-n.y)*r,c=(this.lowerBound.z-n.z)*o,d=(this.upperBound.z-n.z)*o,f=Math.max(Math.max(Math.min(l,h),Math.min(u,a)),Math.min(c,d)),m=Math.min(Math.min(Math.max(l,h),Math.max(u,a)),Math.max(c,d));return!(m<0||f>m)}},Cd=new S,Rd=[new S,new S,new S,new S,new S,new S,new S,new S],$a=class{constructor(){this.matrix=[]}get(e,t){let{index:n}=e,{index:i}=t;if(i>n){let r=i;i=n,n=r}return this.matrix[(n*(n+1)>>1)+i-1]}set(e,t,n){let{index:i}=e,{index:r}=t;if(r>i){let o=r;r=i,i=o}this.matrix[(i*(i+1)>>1)+r-1]=n?1:0}reset(){for(let e=0,t=this.matrix.length;e!==t;e++)this.matrix[e]=0}setNumObjects(e){this.matrix.length=e*(e-1)>>1}},Za=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;return n[e]===void 0&&(n[e]=[]),n[e].includes(t)||n[e].push(t),this}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return!!(n[e]!==void 0&&n[e].includes(t))}hasAnyEventListener(e){return this._listeners===void 0?!1:this._listeners[e]!==void 0}removeEventListener(e,t){if(this._listeners===void 0)return this;let n=this._listeners;if(n[e]===void 0)return this;let i=n[e].indexOf(t);return i!==-1&&n[e].splice(i,1),this}dispatchEvent(e){if(this._listeners===void 0)return this;let n=this._listeners[e.type];if(n!==void 0){e.target=this;for(let i=0,r=n.length;i<r;i++)n[i].call(this,e)}return this}},Wt=class s{constructor(e,t,n,i){e===void 0&&(e=0),t===void 0&&(t=0),n===void 0&&(n=0),i===void 0&&(i=1),this.x=e,this.y=t,this.z=n,this.w=i}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}toString(){return`${this.x},${this.y},${this.z},${this.w}`}toArray(){return[this.x,this.y,this.z,this.w]}setFromAxisAngle(e,t){let n=Math.sin(t*.5);return this.x=e.x*n,this.y=e.y*n,this.z=e.z*n,this.w=Math.cos(t*.5),this}toAxisAngle(e){e===void 0&&(e=new S),this.normalize();let t=2*Math.acos(this.w),n=Math.sqrt(1-this.w*this.w);return n<.001?(e.x=this.x,e.y=this.y,e.z=this.z):(e.x=this.x/n,e.y=this.y/n,e.z=this.z/n),[e,t]}setFromVectors(e,t){if(e.isAntiparallelTo(t)){let n=h_,i=u_;e.tangents(n,i),this.setFromAxisAngle(n,Math.PI)}else{let n=e.cross(t);this.x=n.x,this.y=n.y,this.z=n.z,this.w=Math.sqrt(e.length()**2*t.length()**2)+e.dot(t),this.normalize()}return this}mult(e,t){t===void 0&&(t=new s);let n=this.x,i=this.y,r=this.z,o=this.w,l=e.x,h=e.y,u=e.z,a=e.w;return t.x=n*a+o*l+i*u-r*h,t.y=i*a+o*h+r*l-n*u,t.z=r*a+o*u+n*h-i*l,t.w=o*a-n*l-i*h-r*u,t}inverse(e){e===void 0&&(e=new s);let t=this.x,n=this.y,i=this.z,r=this.w;this.conjugate(e);let o=1/(t*t+n*n+i*i+r*r);return e.x*=o,e.y*=o,e.z*=o,e.w*=o,e}conjugate(e){return e===void 0&&(e=new s),e.x=-this.x,e.y=-this.y,e.z=-this.z,e.w=this.w,e}normalize(){let e=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);return e===0?(this.x=0,this.y=0,this.z=0,this.w=0):(e=1/e,this.x*=e,this.y*=e,this.z*=e,this.w*=e),this}normalizeFast(){let e=(3-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2;return e===0?(this.x=0,this.y=0,this.z=0,this.w=0):(this.x*=e,this.y*=e,this.z*=e,this.w*=e),this}vmult(e,t){t===void 0&&(t=new S);let n=e.x,i=e.y,r=e.z,o=this.x,l=this.y,h=this.z,u=this.w,a=u*n+l*r-h*i,c=u*i+h*n-o*r,d=u*r+o*i-l*n,f=-o*n-l*i-h*r;return t.x=a*u+f*-o+c*-h-d*-l,t.y=c*u+f*-l+d*-o-a*-h,t.z=d*u+f*-h+a*-l-c*-o,t}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w,this}toEuler(e,t){t===void 0&&(t="YZX");let n,i,r,o=this.x,l=this.y,h=this.z,u=this.w;switch(t){case"YZX":let a=o*l+h*u;if(a>.499&&(n=2*Math.atan2(o,u),i=Math.PI/2,r=0),a<-.499&&(n=-2*Math.atan2(o,u),i=-Math.PI/2,r=0),n===void 0){let c=o*o,d=l*l,f=h*h;n=Math.atan2(2*l*u-2*o*h,1-2*d-2*f),i=Math.asin(2*a),r=Math.atan2(2*o*u-2*l*h,1-2*c-2*f)}break;default:throw new Error(`Euler order ${t} not supported yet.`)}e.y=n,e.z=i,e.x=r}setFromEuler(e,t,n,i){i===void 0&&(i="XYZ");let r=Math.cos(e/2),o=Math.cos(t/2),l=Math.cos(n/2),h=Math.sin(e/2),u=Math.sin(t/2),a=Math.sin(n/2);return i==="XYZ"?(this.x=h*o*l+r*u*a,this.y=r*u*l-h*o*a,this.z=r*o*a+h*u*l,this.w=r*o*l-h*u*a):i==="YXZ"?(this.x=h*o*l+r*u*a,this.y=r*u*l-h*o*a,this.z=r*o*a-h*u*l,this.w=r*o*l+h*u*a):i==="ZXY"?(this.x=h*o*l-r*u*a,this.y=r*u*l+h*o*a,this.z=r*o*a+h*u*l,this.w=r*o*l-h*u*a):i==="ZYX"?(this.x=h*o*l-r*u*a,this.y=r*u*l+h*o*a,this.z=r*o*a-h*u*l,this.w=r*o*l+h*u*a):i==="YZX"?(this.x=h*o*l+r*u*a,this.y=r*u*l+h*o*a,this.z=r*o*a-h*u*l,this.w=r*o*l-h*u*a):i==="XZY"&&(this.x=h*o*l-r*u*a,this.y=r*u*l-h*o*a,this.z=r*o*a+h*u*l,this.w=r*o*l+h*u*a),this}clone(){return new s(this.x,this.y,this.z,this.w)}slerp(e,t,n){n===void 0&&(n=new s);let i=this.x,r=this.y,o=this.z,l=this.w,h=e.x,u=e.y,a=e.z,c=e.w,d,f,m,x,p;return f=i*h+r*u+o*a+l*c,f<0&&(f=-f,h=-h,u=-u,a=-a,c=-c),1-f>1e-6?(d=Math.acos(f),m=Math.sin(d),x=Math.sin((1-t)*d)/m,p=Math.sin(t*d)/m):(x=1-t,p=t),n.x=x*i+p*h,n.y=x*r+p*u,n.z=x*o+p*a,n.w=x*l+p*c,n}integrate(e,t,n,i){i===void 0&&(i=new s);let r=e.x*n.x,o=e.y*n.y,l=e.z*n.z,h=this.x,u=this.y,a=this.z,c=this.w,d=t*.5;return i.x+=d*(r*c+o*a-l*u),i.y+=d*(o*c+l*h-r*a),i.z+=d*(l*c+r*u-o*h),i.w+=d*(-r*h-o*u-l*a),i}},h_=new S,u_=new S,d_={SPHERE:1,PLANE:2,BOX:4,COMPOUND:8,CONVEXPOLYHEDRON:16,HEIGHTFIELD:32,PARTICLE:64,CYLINDER:128,TRIMESH:256},me=class s{constructor(e){e===void 0&&(e={}),this.id=s.idCounter++,this.type=e.type||0,this.boundingSphereRadius=0,this.collisionResponse=e.collisionResponse?e.collisionResponse:!0,this.collisionFilterGroup=e.collisionFilterGroup!==void 0?e.collisionFilterGroup:1,this.collisionFilterMask=e.collisionFilterMask!==void 0?e.collisionFilterMask:-1,this.material=e.material?e.material:null,this.body=null}updateBoundingSphereRadius(){throw`computeBoundingSphereRadius() not implemented for shape type ${this.type}`}volume(){throw`volume() not implemented for shape type ${this.type}`}calculateLocalInertia(e,t){throw`calculateLocalInertia() not implemented for shape type ${this.type}`}calculateWorldAABB(e,t,n,i){throw`calculateWorldAABB() not implemented for shape type ${this.type}`}};me.idCounter=0;me.types=d_;var Qe=class s{constructor(e){e===void 0&&(e={}),this.position=new S,this.quaternion=new Wt,e.position&&this.position.copy(e.position),e.quaternion&&this.quaternion.copy(e.quaternion)}pointToLocal(e,t){return s.pointToLocalFrame(this.position,this.quaternion,e,t)}pointToWorld(e,t){return s.pointToWorldFrame(this.position,this.quaternion,e,t)}vectorToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t}static pointToLocalFrame(e,t,n,i){return i===void 0&&(i=new S),n.vsub(e,i),t.conjugate(Id),Id.vmult(i,i),i}static pointToWorldFrame(e,t,n,i){return i===void 0&&(i=new S),t.vmult(n,i),i.vadd(e,i),i}static vectorToWorldFrame(e,t,n){return n===void 0&&(n=new S),e.vmult(t,n),n}static vectorToLocalFrame(e,t,n,i){return i===void 0&&(i=new S),t.w*=-1,t.vmult(n,i),t.w*=-1,i}},Id=new Wt,Yc=class s extends me{constructor(e){e===void 0&&(e={});let{vertices:t=[],faces:n=[],normals:i=[],axes:r,boundingSphereRadius:o}=e;super({type:me.types.CONVEXPOLYHEDRON}),this.vertices=t,this.faces=n,this.faceNormals=i,this.faceNormals.length===0&&this.computeNormals(),o?this.boundingSphereRadius=o:this.updateBoundingSphereRadius(),this.worldVertices=[],this.worldVerticesNeedsUpdate=!0,this.worldFaceNormals=[],this.worldFaceNormalsNeedsUpdate=!0,this.uniqueAxes=r?r.slice():null,this.uniqueEdges=[],this.computeEdges()}computeEdges(){let e=this.faces,t=this.vertices,n=this.uniqueEdges;n.length=0;let i=new S;for(let r=0;r!==e.length;r++){let o=e[r],l=o.length;for(let h=0;h!==l;h++){let u=(h+1)%l;t[o[h]].vsub(t[o[u]],i),i.normalize();let a=!1;for(let c=0;c!==n.length;c++)if(n[c].almostEquals(i)||n[c].almostEquals(i)){a=!0;break}a||n.push(i.clone())}}}computeNormals(){this.faceNormals.length=this.faces.length;for(let e=0;e<this.faces.length;e++){for(let i=0;i<this.faces[e].length;i++)if(!this.vertices[this.faces[e][i]])throw new Error(`Vertex ${this.faces[e][i]} not found!`);let t=this.faceNormals[e]||new S;this.getFaceNormal(e,t),t.negate(t),this.faceNormals[e]=t;let n=this.vertices[this.faces[e][0]];if(t.dot(n)<0){console.error(`.faceNormals[${e}] = Vec3(${t.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);for(let i=0;i<this.faces[e].length;i++)console.warn(`.vertices[${this.faces[e][i]}] = Vec3(${this.vertices[this.faces[e][i]].toString()})`)}}}getFaceNormal(e,t){let n=this.faces[e],i=this.vertices[n[0]],r=this.vertices[n[1]],o=this.vertices[n[2]];s.computeNormal(i,r,o,t)}static computeNormal(e,t,n,i){let r=new S,o=new S;t.vsub(e,o),n.vsub(t,r),r.cross(o,i),i.isZero()||i.normalize()}clipAgainstHull(e,t,n,i,r,o,l,h,u){let a=new S,c=-1,d=-Number.MAX_VALUE;for(let m=0;m<n.faces.length;m++){a.copy(n.faceNormals[m]),r.vmult(a,a);let x=a.dot(o);x>d&&(d=x,c=m)}let f=[];for(let m=0;m<n.faces[c].length;m++){let x=n.vertices[n.faces[c][m]],p=new S;p.copy(x),r.vmult(p,p),i.vadd(p,p),f.push(p)}c>=0&&this.clipFaceAgainstHull(o,e,t,f,l,h,u)}findSeparatingAxis(e,t,n,i,r,o,l,h){let u=new S,a=new S,c=new S,d=new S,f=new S,m=new S,x=Number.MAX_VALUE,p=this;if(p.uniqueAxes)for(let g=0;g!==p.uniqueAxes.length;g++){n.vmult(p.uniqueAxes[g],u);let _=p.testSepAxis(u,e,t,n,i,r);if(_===!1)return!1;_<x&&(x=_,o.copy(u))}else{let g=l?l.length:p.faces.length;for(let _=0;_<g;_++){let y=l?l[_]:_;u.copy(p.faceNormals[y]),n.vmult(u,u);let v=p.testSepAxis(u,e,t,n,i,r);if(v===!1)return!1;v<x&&(x=v,o.copy(u))}}if(e.uniqueAxes)for(let g=0;g!==e.uniqueAxes.length;g++){r.vmult(e.uniqueAxes[g],a);let _=p.testSepAxis(a,e,t,n,i,r);if(_===!1)return!1;_<x&&(x=_,o.copy(a))}else{let g=h?h.length:e.faces.length;for(let _=0;_<g;_++){let y=h?h[_]:_;a.copy(e.faceNormals[y]),r.vmult(a,a);let v=p.testSepAxis(a,e,t,n,i,r);if(v===!1)return!1;v<x&&(x=v,o.copy(a))}}for(let g=0;g!==p.uniqueEdges.length;g++){n.vmult(p.uniqueEdges[g],d);for(let _=0;_!==e.uniqueEdges.length;_++)if(r.vmult(e.uniqueEdges[_],f),d.cross(f,m),!m.almostZero()){m.normalize();let y=p.testSepAxis(m,e,t,n,i,r);if(y===!1)return!1;y<x&&(x=y,o.copy(m))}}return i.vsub(t,c),c.dot(o)>0&&o.negate(o),!0}testSepAxis(e,t,n,i,r,o){let l=this;s.project(l,e,n,i,Vc),s.project(t,e,r,o,Hc);let h=Vc[0],u=Vc[1],a=Hc[0],c=Hc[1];if(h<c||a<u)return!1;let d=h-c,f=a-u;return d<f?d:f}calculateLocalInertia(e,t){let n=new S,i=new S;this.computeLocalAABB(i,n);let r=n.x-i.x,o=n.y-i.y,l=n.z-i.z;t.x=1/12*e*(2*o*2*o+2*l*2*l),t.y=1/12*e*(2*r*2*r+2*l*2*l),t.z=1/12*e*(2*o*2*o+2*r*2*r)}getPlaneConstantOfFace(e){let t=this.faces[e],n=this.faceNormals[e],i=this.vertices[t[0]];return-n.dot(i)}clipFaceAgainstHull(e,t,n,i,r,o,l){let h=new S,u=new S,a=new S,c=new S,d=new S,f=new S,m=new S,x=new S,p=this,g=[],_=i,y=g,v=-1,T=Number.MAX_VALUE;for(let b=0;b<p.faces.length;b++){h.copy(p.faceNormals[b]),n.vmult(h,h);let P=h.dot(e);P<T&&(T=P,v=b)}if(v<0)return;let A=p.faces[v];A.connectedFaces=[];for(let b=0;b<p.faces.length;b++)for(let P=0;P<p.faces[b].length;P++)A.indexOf(p.faces[b][P])!==-1&&b!==v&&A.connectedFaces.indexOf(b)===-1&&A.connectedFaces.push(b);let C=A.length;for(let b=0;b<C;b++){let P=p.vertices[A[b]],B=p.vertices[A[(b+1)%C]];P.vsub(B,u),a.copy(u),n.vmult(a,a),t.vadd(a,a),c.copy(this.faceNormals[v]),n.vmult(c,c),t.vadd(c,c),a.cross(c,d),d.negate(d),f.copy(P),n.vmult(f,f),t.vadd(f,f);let L=A.connectedFaces[b];m.copy(this.faceNormals[L]);let U=this.getPlaneConstantOfFace(L);x.copy(m),n.vmult(x,x);let O=U-x.dot(t);for(this.clipFaceAgainstPlane(_,y,x,O);_.length;)_.shift();for(;y.length;)_.push(y.shift())}m.copy(this.faceNormals[v]);let R=this.getPlaneConstantOfFace(v);x.copy(m),n.vmult(x,x);let M=R-x.dot(t);for(let b=0;b<_.length;b++){let P=x.dot(_[b])+M;if(P<=r&&(console.log(`clamped: depth=${P} to minDist=${r}`),P=r),P<=o){let B=_[b];if(P<=1e-6){let L={point:B,normal:x,depth:P};l.push(L)}}}}clipFaceAgainstPlane(e,t,n,i){let r,o,l=e.length;if(l<2)return t;let h=e[e.length-1],u=e[0];r=n.dot(h)+i;for(let a=0;a<l;a++){if(u=e[a],o=n.dot(u)+i,r<0)if(o<0){let c=new S;c.copy(u),t.push(c)}else{let c=new S;h.lerp(u,r/(r-o),c),t.push(c)}else if(o<0){let c=new S;h.lerp(u,r/(r-o),c),t.push(c),t.push(u)}h=u,r=o}return t}computeWorldVertices(e,t){for(;this.worldVertices.length<this.vertices.length;)this.worldVertices.push(new S);let n=this.vertices,i=this.worldVertices;for(let r=0;r!==this.vertices.length;r++)t.vmult(n[r],i[r]),e.vadd(i[r],i[r]);this.worldVerticesNeedsUpdate=!1}computeLocalAABB(e,t){let n=this.vertices;e.set(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),t.set(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);for(let i=0;i<this.vertices.length;i++){let r=n[i];r.x<e.x?e.x=r.x:r.x>t.x&&(t.x=r.x),r.y<e.y?e.y=r.y:r.y>t.y&&(t.y=r.y),r.z<e.z?e.z=r.z:r.z>t.z&&(t.z=r.z)}}computeWorldFaceNormals(e){let t=this.faceNormals.length;for(;this.worldFaceNormals.length<t;)this.worldFaceNormals.push(new S);let n=this.faceNormals,i=this.worldFaceNormals;for(let r=0;r!==t;r++)e.vmult(n[r],i[r]);this.worldFaceNormalsNeedsUpdate=!1}updateBoundingSphereRadius(){let e=0,t=this.vertices;for(let n=0;n!==t.length;n++){let i=t[n].lengthSquared();i>e&&(e=i)}this.boundingSphereRadius=Math.sqrt(e)}calculateWorldAABB(e,t,n,i){let r=this.vertices,o,l,h,u,a,c,d=new S;for(let f=0;f<r.length;f++){d.copy(r[f]),t.vmult(d,d),e.vadd(d,d);let m=d;(o===void 0||m.x<o)&&(o=m.x),(u===void 0||m.x>u)&&(u=m.x),(l===void 0||m.y<l)&&(l=m.y),(a===void 0||m.y>a)&&(a=m.y),(h===void 0||m.z<h)&&(h=m.z),(c===void 0||m.z>c)&&(c=m.z)}n.set(o,l,h),i.set(u,a,c)}volume(){return 4*Math.PI*this.boundingSphereRadius/3}getAveragePointLocal(e){e===void 0&&(e=new S);let t=this.vertices;for(let n=0;n<t.length;n++)e.vadd(t[n],e);return e.scale(1/t.length,e),e}transformAllPoints(e,t){let n=this.vertices.length,i=this.vertices;if(t){for(let r=0;r<n;r++){let o=i[r];t.vmult(o,o)}for(let r=0;r<this.faceNormals.length;r++){let o=this.faceNormals[r];t.vmult(o,o)}}if(e)for(let r=0;r<n;r++){let o=i[r];o.vadd(e,o)}}pointIsInside(e){let t=this.vertices,n=this.faces,i=this.faceNormals,r=null,o=new S;this.getAveragePointLocal(o);for(let l=0;l<this.faces.length;l++){let h=i[l],u=t[n[l][0]],a=new S;e.vsub(u,a);let c=h.dot(a),d=new S;o.vsub(u,d);let f=h.dot(d);if(c<0&&f>0||c>0&&f<0)return!1}return r?1:-1}static project(e,t,n,i,r){let o=e.vertices.length,l=p_,h=0,u=0,a=m_,c=e.vertices;a.setZero(),Qe.vectorToLocalFrame(n,i,t,l),Qe.pointToLocalFrame(n,i,a,a);let d=a.dot(l);u=h=c[0].dot(l);for(let f=1;f<o;f++){let m=c[f].dot(l);m>h&&(h=m),m<u&&(u=m)}if(u-=d,h-=d,u>h){let f=u;u=h,h=f}r[0]=h,r[1]=u}},Vc=[],Hc=[],f_=new S,p_=new S,m_=new S,Lr=class s extends me{constructor(e){super({type:me.types.BOX}),this.halfExtents=e,this.convexPolyhedronRepresentation=null,this.updateConvexPolyhedronRepresentation(),this.updateBoundingSphereRadius()}updateConvexPolyhedronRepresentation(){let e=this.halfExtents.x,t=this.halfExtents.y,n=this.halfExtents.z,i=S,r=[new i(-e,-t,-n),new i(e,-t,-n),new i(e,t,-n),new i(-e,t,-n),new i(-e,-t,n),new i(e,-t,n),new i(e,t,n),new i(-e,t,n)],o=[[3,2,1,0],[4,5,6,7],[5,4,0,1],[2,3,7,6],[0,4,7,3],[1,2,6,5]],l=[new i(0,0,1),new i(0,1,0),new i(1,0,0)],h=new Yc({vertices:r,faces:o,axes:l});this.convexPolyhedronRepresentation=h,h.material=this.material}calculateLocalInertia(e,t){return t===void 0&&(t=new S),s.calculateInertia(this.halfExtents,e,t),t}static calculateInertia(e,t,n){let i=e;n.x=1/12*t*(2*i.y*2*i.y+2*i.z*2*i.z),n.y=1/12*t*(2*i.x*2*i.x+2*i.z*2*i.z),n.z=1/12*t*(2*i.y*2*i.y+2*i.x*2*i.x)}getSideNormals(e,t){let n=e,i=this.halfExtents;if(n[0].set(i.x,0,0),n[1].set(0,i.y,0),n[2].set(0,0,i.z),n[3].set(-i.x,0,0),n[4].set(0,-i.y,0),n[5].set(0,0,-i.z),t!==void 0)for(let r=0;r!==n.length;r++)t.vmult(n[r],n[r]);return n}volume(){return 8*this.halfExtents.x*this.halfExtents.y*this.halfExtents.z}updateBoundingSphereRadius(){this.boundingSphereRadius=this.halfExtents.length()}forEachWorldCorner(e,t,n){let i=this.halfExtents,r=[[i.x,i.y,i.z],[-i.x,i.y,i.z],[-i.x,-i.y,i.z],[-i.x,-i.y,-i.z],[i.x,-i.y,-i.z],[i.x,i.y,-i.z],[-i.x,i.y,-i.z],[i.x,-i.y,i.z]];for(let o=0;o<r.length;o++)gi.set(r[o][0],r[o][1],r[o][2]),t.vmult(gi,gi),e.vadd(gi,gi),n(gi.x,gi.y,gi.z)}calculateWorldAABB(e,t,n,i){let r=this.halfExtents;Ln[0].set(r.x,r.y,r.z),Ln[1].set(-r.x,r.y,r.z),Ln[2].set(-r.x,-r.y,r.z),Ln[3].set(-r.x,-r.y,-r.z),Ln[4].set(r.x,-r.y,-r.z),Ln[5].set(r.x,r.y,-r.z),Ln[6].set(-r.x,r.y,-r.z),Ln[7].set(r.x,-r.y,r.z);let o=Ln[0];t.vmult(o,o),e.vadd(o,o),i.copy(o),n.copy(o);for(let l=1;l<8;l++){let h=Ln[l];t.vmult(h,h),e.vadd(h,h);let u=h.x,a=h.y,c=h.z;u>i.x&&(i.x=u),a>i.y&&(i.y=a),c>i.z&&(i.z=c),u<n.x&&(n.x=u),a<n.y&&(n.y=a),c<n.z&&(n.z=c)}}},gi=new S,Ln=[new S,new S,new S,new S,new S,new S,new S,new S],ih={DYNAMIC:1,STATIC:2,KINEMATIC:4},sh={AWAKE:0,SLEEPY:1,SLEEPING:2},Ge=class s extends Za{constructor(e){e===void 0&&(e={}),super(),this.id=s.idCounter++,this.index=-1,this.world=null,this.vlambda=new S,this.collisionFilterGroup=typeof e.collisionFilterGroup=="number"?e.collisionFilterGroup:1,this.collisionFilterMask=typeof e.collisionFilterMask=="number"?e.collisionFilterMask:-1,this.collisionResponse=typeof e.collisionResponse=="boolean"?e.collisionResponse:!0,this.position=new S,this.previousPosition=new S,this.interpolatedPosition=new S,this.initPosition=new S,e.position&&(this.position.copy(e.position),this.previousPosition.copy(e.position),this.interpolatedPosition.copy(e.position),this.initPosition.copy(e.position)),this.velocity=new S,e.velocity&&this.velocity.copy(e.velocity),this.initVelocity=new S,this.force=new S;let t=typeof e.mass=="number"?e.mass:0;this.mass=t,this.invMass=t>0?1/t:0,this.material=e.material||null,this.linearDamping=typeof e.linearDamping=="number"?e.linearDamping:.01,this.type=t<=0?s.STATIC:s.DYNAMIC,typeof e.type==typeof s.STATIC&&(this.type=e.type),this.allowSleep=typeof e.allowSleep<"u"?e.allowSleep:!0,this.sleepState=s.AWAKE,this.sleepSpeedLimit=typeof e.sleepSpeedLimit<"u"?e.sleepSpeedLimit:.1,this.sleepTimeLimit=typeof e.sleepTimeLimit<"u"?e.sleepTimeLimit:1,this.timeLastSleepy=0,this.wakeUpAfterNarrowphase=!1,this.torque=new S,this.quaternion=new Wt,this.initQuaternion=new Wt,this.previousQuaternion=new Wt,this.interpolatedQuaternion=new Wt,e.quaternion&&(this.quaternion.copy(e.quaternion),this.initQuaternion.copy(e.quaternion),this.previousQuaternion.copy(e.quaternion),this.interpolatedQuaternion.copy(e.quaternion)),this.angularVelocity=new S,e.angularVelocity&&this.angularVelocity.copy(e.angularVelocity),this.initAngularVelocity=new S,this.shapes=[],this.shapeOffsets=[],this.shapeOrientations=[],this.inertia=new S,this.invInertia=new S,this.invInertiaWorld=new xi,this.invMassSolve=0,this.invInertiaSolve=new S,this.invInertiaWorldSolve=new xi,this.fixedRotation=typeof e.fixedRotation<"u"?e.fixedRotation:!1,this.angularDamping=typeof e.angularDamping<"u"?e.angularDamping:.01,this.linearFactor=new S(1,1,1),e.linearFactor&&this.linearFactor.copy(e.linearFactor),this.angularFactor=new S(1,1,1),e.angularFactor&&this.angularFactor.copy(e.angularFactor),this.aabb=new tn,this.aabbNeedsUpdate=!0,this.boundingRadius=0,this.wlambda=new S,this.isTrigger=!!e.isTrigger,e.shape&&this.addShape(e.shape),this.updateMassProperties()}wakeUp(){let e=this.sleepState;this.sleepState=s.AWAKE,this.wakeUpAfterNarrowphase=!1,e===s.SLEEPING&&this.dispatchEvent(s.wakeupEvent)}sleep(){this.sleepState=s.SLEEPING,this.velocity.set(0,0,0),this.angularVelocity.set(0,0,0),this.wakeUpAfterNarrowphase=!1}sleepTick(e){if(this.allowSleep){let t=this.sleepState,n=this.velocity.lengthSquared()+this.angularVelocity.lengthSquared(),i=this.sleepSpeedLimit**2;t===s.AWAKE&&n<i?(this.sleepState=s.SLEEPY,this.timeLastSleepy=e,this.dispatchEvent(s.sleepyEvent)):t===s.SLEEPY&&n>i?this.wakeUp():t===s.SLEEPY&&e-this.timeLastSleepy>this.sleepTimeLimit&&(this.sleep(),this.dispatchEvent(s.sleepEvent))}}updateSolveMassProperties(){this.sleepState===s.SLEEPING||this.type===s.KINEMATIC?(this.invMassSolve=0,this.invInertiaSolve.setZero(),this.invInertiaWorldSolve.setZero()):(this.invMassSolve=this.invMass,this.invInertiaSolve.copy(this.invInertia),this.invInertiaWorldSolve.copy(this.invInertiaWorld))}pointToLocalFrame(e,t){return t===void 0&&(t=new S),e.vsub(this.position,t),this.quaternion.conjugate().vmult(t,t),t}vectorToLocalFrame(e,t){return t===void 0&&(t=new S),this.quaternion.conjugate().vmult(e,t),t}pointToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t.vadd(this.position,t),t}vectorToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t}addShape(e,t,n){let i=new S,r=new Wt;return t&&i.copy(t),n&&r.copy(n),this.shapes.push(e),this.shapeOffsets.push(i),this.shapeOrientations.push(r),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,e.body=this,this}removeShape(e){let t=this.shapes.indexOf(e);return t===-1?(console.warn("Shape does not belong to the body"),this):(this.shapes.splice(t,1),this.shapeOffsets.splice(t,1),this.shapeOrientations.splice(t,1),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,e.body=null,this)}updateBoundingRadius(){let e=this.shapes,t=this.shapeOffsets,n=e.length,i=0;for(let r=0;r!==n;r++){let o=e[r];o.updateBoundingSphereRadius();let l=t[r].length(),h=o.boundingSphereRadius;l+h>i&&(i=l+h)}this.boundingRadius=i}updateAABB(){let e=this.shapes,t=this.shapeOffsets,n=this.shapeOrientations,i=e.length,r=g_,o=x_,l=this.quaternion,h=this.aabb,u=__;for(let a=0;a!==i;a++){let c=e[a];l.vmult(t[a],r),r.vadd(this.position,r),l.mult(n[a],o),c.calculateWorldAABB(r,o,u.lowerBound,u.upperBound),a===0?h.copy(u):h.extend(u)}this.aabbNeedsUpdate=!1}updateInertiaWorld(e){let t=this.invInertia;if(!(t.x===t.y&&t.y===t.z&&!e)){let n=v_,i=y_;n.setRotationFromQuaternion(this.quaternion),n.transpose(i),n.scale(t,n),n.mmult(i,this.invInertiaWorld)}}applyForce(e,t){if(t===void 0&&(t=new S),this.type!==s.DYNAMIC)return;this.sleepState===s.SLEEPING&&this.wakeUp();let n=w_;t.cross(e,n),this.force.vadd(e,this.force),this.torque.vadd(n,this.torque)}applyLocalForce(e,t){if(t===void 0&&(t=new S),this.type!==s.DYNAMIC)return;let n=M_,i=S_;this.vectorToWorldFrame(e,n),this.vectorToWorldFrame(t,i),this.applyForce(n,i)}applyTorque(e){this.type===s.DYNAMIC&&(this.sleepState===s.SLEEPING&&this.wakeUp(),this.torque.vadd(e,this.torque))}applyImpulse(e,t){if(t===void 0&&(t=new S),this.type!==s.DYNAMIC)return;this.sleepState===s.SLEEPING&&this.wakeUp();let n=t,i=A_;i.copy(e),i.scale(this.invMass,i),this.velocity.vadd(i,this.velocity);let r=T_;n.cross(e,r),this.invInertiaWorld.vmult(r,r),this.angularVelocity.vadd(r,this.angularVelocity)}applyLocalImpulse(e,t){if(t===void 0&&(t=new S),this.type!==s.DYNAMIC)return;let n=E_,i=C_;this.vectorToWorldFrame(e,n),this.vectorToWorldFrame(t,i),this.applyImpulse(n,i)}updateMassProperties(){let e=R_;this.invMass=this.mass>0?1/this.mass:0;let t=this.inertia,n=this.fixedRotation;this.updateAABB(),e.set((this.aabb.upperBound.x-this.aabb.lowerBound.x)/2,(this.aabb.upperBound.y-this.aabb.lowerBound.y)/2,(this.aabb.upperBound.z-this.aabb.lowerBound.z)/2),Lr.calculateInertia(e,this.mass,t),this.invInertia.set(t.x>0&&!n?1/t.x:0,t.y>0&&!n?1/t.y:0,t.z>0&&!n?1/t.z:0),this.updateInertiaWorld(!0)}getVelocityAtWorldPoint(e,t){let n=new S;return e.vsub(this.position,n),this.angularVelocity.cross(n,t),this.velocity.vadd(t,t),t}integrate(e,t,n){if(this.previousPosition.copy(this.position),this.previousQuaternion.copy(this.quaternion),!(this.type===s.DYNAMIC||this.type===s.KINEMATIC)||this.sleepState===s.SLEEPING)return;let i=this.velocity,r=this.angularVelocity,o=this.position,l=this.force,h=this.torque,u=this.quaternion,a=this.invMass,c=this.invInertiaWorld,d=this.linearFactor,f=a*e;i.x+=l.x*f*d.x,i.y+=l.y*f*d.y,i.z+=l.z*f*d.z;let m=c.elements,x=this.angularFactor,p=h.x*x.x,g=h.y*x.y,_=h.z*x.z;r.x+=e*(m[0]*p+m[1]*g+m[2]*_),r.y+=e*(m[3]*p+m[4]*g+m[5]*_),r.z+=e*(m[6]*p+m[7]*g+m[8]*_),o.x+=i.x*e,o.y+=i.y*e,o.z+=i.z*e,u.integrate(this.angularVelocity,e,this.angularFactor,u),t&&(n?u.normalizeFast():u.normalize()),this.aabbNeedsUpdate=!0,this.updateInertiaWorld()}};Ge.idCounter=0;Ge.COLLIDE_EVENT_NAME="collide";Ge.DYNAMIC=ih.DYNAMIC;Ge.STATIC=ih.STATIC;Ge.KINEMATIC=ih.KINEMATIC;Ge.AWAKE=sh.AWAKE;Ge.SLEEPY=sh.SLEEPY;Ge.SLEEPING=sh.SLEEPING;Ge.wakeupEvent={type:"wakeup"};Ge.sleepyEvent={type:"sleepy"};Ge.sleepEvent={type:"sleep"};var g_=new S,x_=new Wt,__=new tn,v_=new xi,y_=new xi,b_=new xi,w_=new S,M_=new S,S_=new S,A_=new S,T_=new S,E_=new S,C_=new S,R_=new S,ja=class{constructor(){this.world=null,this.useBoundingBoxes=!1,this.dirty=!0}collisionPairs(e,t,n){throw new Error("collisionPairs not implemented for this BroadPhase class!")}needBroadphaseCollision(e,t){return!((e.collisionFilterGroup&t.collisionFilterMask)===0||(t.collisionFilterGroup&e.collisionFilterMask)===0||((e.type&Ge.STATIC)!==0||e.sleepState===Ge.SLEEPING)&&((t.type&Ge.STATIC)!==0||t.sleepState===Ge.SLEEPING))}intersectionTest(e,t,n,i){this.useBoundingBoxes?this.doBoundingBoxBroadphase(e,t,n,i):this.doBoundingSphereBroadphase(e,t,n,i)}doBoundingSphereBroadphase(e,t,n,i){let r=I_;t.position.vsub(e.position,r);let o=(e.boundingRadius+t.boundingRadius)**2;r.lengthSquared()<o&&(n.push(e),i.push(t))}doBoundingBoxBroadphase(e,t,n,i){e.aabbNeedsUpdate&&e.updateAABB(),t.aabbNeedsUpdate&&t.updateAABB(),e.aabb.overlaps(t.aabb)&&(n.push(e),i.push(t))}makePairsUnique(e,t){let n=P_,i=L_,r=N_,o=e.length;for(let l=0;l!==o;l++)i[l]=e[l],r[l]=t[l];e.length=0,t.length=0;for(let l=0;l!==o;l++){let h=i[l].id,u=r[l].id,a=h<u?`${h},${u}`:`${u},${h}`;n[a]=l,n.keys.push(a)}for(let l=0;l!==n.keys.length;l++){let h=n.keys.pop(),u=n[h];e.push(i[u]),t.push(r[u]),delete n[h]}}setWorld(e){}static boundingSphereCheck(e,t){let n=new S;e.position.vsub(t.position,n);let i=e.shapes[0],r=t.shapes[0];return Math.pow(i.boundingSphereRadius+r.boundingSphereRadius,2)>n.lengthSquared()}aabbQuery(e,t,n){return console.warn(".aabbQuery is not implemented in this Broadphase subclass."),[]}},I_=new S;new S;new Wt;new S;var P_={keys:[]},L_=[],N_=[];new S;var YM=new S;new S;var $c=class extends ja{constructor(){super()}collisionPairs(e,t,n){let i=e.bodies,r=i.length,o,l;for(let h=0;h!==r;h++)for(let u=0;u!==h;u++)o=i[h],l=i[u],this.needBroadphaseCollision(o,l)&&this.intersectionTest(o,l,t,n)}aabbQuery(e,t,n){n===void 0&&(n=[]);for(let i=0;i<e.bodies.length;i++){let r=e.bodies[i];r.aabbNeedsUpdate&&r.updateAABB(),r.aabb.overlaps(t)&&n.push(r)}return n}},_i=class{constructor(){this.rayFromWorld=new S,this.rayToWorld=new S,this.hitNormalWorld=new S,this.hitPointWorld=new S,this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}reset(){this.rayFromWorld.setZero(),this.rayToWorld.setZero(),this.hitNormalWorld.setZero(),this.hitPointWorld.setZero(),this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}abort(){this.shouldStop=!0}set(e,t,n,i,r,o,l){this.rayFromWorld.copy(e),this.rayToWorld.copy(t),this.hitNormalWorld.copy(n),this.hitPointWorld.copy(i),this.shape=r,this.body=o,this.distance=l}},Hd,Gd,Wd,qd,Xd,Yd,$d,rh={CLOSEST:1,ANY:2,ALL:4};Hd=me.types.SPHERE;Gd=me.types.PLANE;Wd=me.types.BOX;qd=me.types.CYLINDER;Xd=me.types.CONVEXPOLYHEDRON;Yd=me.types.HEIGHTFIELD;$d=me.types.TRIMESH;var un=class s{get[Hd](){return this._intersectSphere}get[Gd](){return this._intersectPlane}get[Wd](){return this._intersectBox}get[qd](){return this._intersectConvex}get[Xd](){return this._intersectConvex}get[Yd](){return this._intersectHeightfield}get[$d](){return this._intersectTrimesh}constructor(e,t){e===void 0&&(e=new S),t===void 0&&(t=new S),this.from=e.clone(),this.to=t.clone(),this.direction=new S,this.precision=1e-4,this.checkCollisionResponse=!0,this.skipBackfaces=!1,this.collisionFilterMask=-1,this.collisionFilterGroup=-1,this.mode=s.ANY,this.result=new _i,this.hasHit=!1,this.callback=n=>{}}intersectWorld(e,t){return this.mode=t.mode||s.ANY,this.result=t.result||new _i,this.skipBackfaces=!!t.skipBackfaces,this.collisionFilterMask=typeof t.collisionFilterMask<"u"?t.collisionFilterMask:-1,this.collisionFilterGroup=typeof t.collisionFilterGroup<"u"?t.collisionFilterGroup:-1,this.checkCollisionResponse=typeof t.checkCollisionResponse<"u"?t.checkCollisionResponse:!0,t.from&&this.from.copy(t.from),t.to&&this.to.copy(t.to),this.callback=t.callback||(()=>{}),this.hasHit=!1,this.result.reset(),this.updateDirection(),this.getAABB(Pd),Gc.length=0,e.broadphase.aabbQuery(e,Pd,Gc),this.intersectBodies(Gc),this.hasHit}intersectBody(e,t){t&&(this.result=t,this.updateDirection());let n=this.checkCollisionResponse;if(n&&!e.collisionResponse||(this.collisionFilterGroup&e.collisionFilterMask)===0||(e.collisionFilterGroup&this.collisionFilterMask)===0)return;let i=D_,r=F_;for(let o=0,l=e.shapes.length;o<l;o++){let h=e.shapes[o];if(!(n&&!h.collisionResponse)&&(e.quaternion.mult(e.shapeOrientations[o],r),e.quaternion.vmult(e.shapeOffsets[o],i),i.vadd(e.position,i),this.intersectShape(h,r,i,e),this.result.shouldStop))break}}intersectBodies(e,t){t&&(this.result=t,this.updateDirection());for(let n=0,i=e.length;!this.result.shouldStop&&n<i;n++)this.intersectBody(e[n])}updateDirection(){this.to.vsub(this.from,this.direction),this.direction.normalize()}intersectShape(e,t,n,i){let r=this.from;if(K_(r,this.direction,n)>e.boundingSphereRadius)return;let l=this[e.type];l&&l.call(this,e,t,n,i,e)}_intersectBox(e,t,n,i,r){return this._intersectConvex(e.convexPolyhedronRepresentation,t,n,i,r)}_intersectPlane(e,t,n,i,r){let o=this.from,l=this.to,h=this.direction,u=new S(0,0,1);t.vmult(u,u);let a=new S;o.vsub(n,a);let c=a.dot(u);l.vsub(n,a);let d=a.dot(u);if(c*d>0||o.distanceTo(l)<c)return;let f=u.dot(h);if(Math.abs(f)<this.precision)return;let m=new S,x=new S,p=new S;o.vsub(n,m);let g=-u.dot(m)/f;h.scale(g,x),o.vadd(x,p),this.reportIntersection(u,p,r,i,-1)}getAABB(e){let{lowerBound:t,upperBound:n}=e,i=this.to,r=this.from;t.x=Math.min(i.x,r.x),t.y=Math.min(i.y,r.y),t.z=Math.min(i.z,r.z),n.x=Math.max(i.x,r.x),n.y=Math.max(i.y,r.y),n.z=Math.max(i.z,r.z)}_intersectHeightfield(e,t,n,i,r){e.data,e.elementSize;let o=B_;o.from.copy(this.from),o.to.copy(this.to),Qe.pointToLocalFrame(n,t,o.from,o.from),Qe.pointToLocalFrame(n,t,o.to,o.to),o.updateDirection();let l=U_,h,u,a,c;h=u=0,a=c=e.data.length-1;let d=new tn;o.getAABB(d),e.getIndexOfPosition(d.lowerBound.x,d.lowerBound.y,l,!0),h=Math.max(h,l[0]),u=Math.max(u,l[1]),e.getIndexOfPosition(d.upperBound.x,d.upperBound.y,l,!0),a=Math.min(a,l[0]+1),c=Math.min(c,l[1]+1);for(let f=h;f<a;f++)for(let m=u;m<c;m++){if(this.result.shouldStop)return;if(e.getAabbAtIndex(f,m,d),!!d.overlapsRay(o)){if(e.getConvexTrianglePillar(f,m,!1),Qe.pointToWorldFrame(n,t,e.pillarOffset,Ga),this._intersectConvex(e.pillarConvex,t,Ga,i,r,Ld),this.result.shouldStop)return;e.getConvexTrianglePillar(f,m,!0),Qe.pointToWorldFrame(n,t,e.pillarOffset,Ga),this._intersectConvex(e.pillarConvex,t,Ga,i,r,Ld)}}}_intersectSphere(e,t,n,i,r){let o=this.from,l=this.to,h=e.radius,u=(l.x-o.x)**2+(l.y-o.y)**2+(l.z-o.z)**2,a=2*((l.x-o.x)*(o.x-n.x)+(l.y-o.y)*(o.y-n.y)+(l.z-o.z)*(o.z-n.z)),c=(o.x-n.x)**2+(o.y-n.y)**2+(o.z-n.z)**2-h**2,d=a**2-4*u*c,f=z_,m=O_;if(!(d<0))if(d===0)o.lerp(l,d,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,r,i,-1);else{let x=(-a-Math.sqrt(d))/(2*u),p=(-a+Math.sqrt(d))/(2*u);if(x>=0&&x<=1&&(o.lerp(l,x,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,r,i,-1)),this.result.shouldStop)return;p>=0&&p<=1&&(o.lerp(l,p,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,r,i,-1))}}_intersectConvex(e,t,n,i,r,o){let l=k_,h=Nd,u=o&&o.faceList||null,a=e.faces,c=e.vertices,d=e.faceNormals,f=this.direction,m=this.from,x=this.to,p=m.distanceTo(x),g=u?u.length:a.length,_=this.result;for(let y=0;!_.shouldStop&&y<g;y++){let v=u?u[y]:y,T=a[v],A=d[v],C=t,R=n;h.copy(c[T[0]]),C.vmult(h,h),h.vadd(R,h),h.vsub(m,h),C.vmult(A,l);let M=f.dot(l);if(Math.abs(M)<this.precision)continue;let b=l.dot(h)/M;if(!(b<0)){f.scale(b,$t),$t.vadd(m,$t),Mn.copy(c[T[0]]),C.vmult(Mn,Mn),R.vadd(Mn,Mn);for(let P=1;!_.shouldStop&&P<T.length-1;P++){Nn.copy(c[T[P]]),Dn.copy(c[T[P+1]]),C.vmult(Nn,Nn),C.vmult(Dn,Dn),R.vadd(Nn,Nn),R.vadd(Dn,Dn);let B=$t.distanceTo(m);!(s.pointInTriangle($t,Mn,Nn,Dn)||s.pointInTriangle($t,Nn,Mn,Dn))||B>p||this.reportIntersection(l,$t,r,i,v)}}}}_intersectTrimesh(e,t,n,i,r,o){let l=G_,h=Z_,u=j_,a=Nd,c=W_,d=q_,f=X_,m=$_,x=Y_,p=e.indices;e.vertices;let g=this.from,_=this.to,y=this.direction;u.position.copy(n),u.quaternion.copy(t),Qe.vectorToLocalFrame(n,t,y,c),Qe.pointToLocalFrame(n,t,g,d),Qe.pointToLocalFrame(n,t,_,f),f.x*=e.scale.x,f.y*=e.scale.y,f.z*=e.scale.z,d.x*=e.scale.x,d.y*=e.scale.y,d.z*=e.scale.z,f.vsub(d,c),c.normalize();let v=d.distanceSquared(f);e.tree.rayQuery(this,u,h);for(let T=0,A=h.length;!this.result.shouldStop&&T!==A;T++){let C=h[T];e.getNormal(C,l),e.getVertex(p[C*3],Mn),Mn.vsub(d,a);let R=c.dot(l),M=l.dot(a)/R;if(M<0)continue;c.scale(M,$t),$t.vadd(d,$t),e.getVertex(p[C*3+1],Nn),e.getVertex(p[C*3+2],Dn);let b=$t.distanceSquared(d);!(s.pointInTriangle($t,Nn,Mn,Dn)||s.pointInTriangle($t,Mn,Nn,Dn))||b>v||(Qe.vectorToWorldFrame(t,l,x),Qe.pointToWorldFrame(n,t,$t,m),this.reportIntersection(x,m,r,i,C))}h.length=0}reportIntersection(e,t,n,i,r){let o=this.from,l=this.to,h=o.distanceTo(t),u=this.result;if(!(this.skipBackfaces&&e.dot(this.direction)>0))switch(u.hitFaceIndex=typeof r<"u"?r:-1,this.mode){case s.ALL:this.hasHit=!0,u.set(o,l,e,t,n,i,h),u.hasHit=!0,this.callback(u);break;case s.CLOSEST:(h<u.distance||!u.hasHit)&&(this.hasHit=!0,u.hasHit=!0,u.set(o,l,e,t,n,i,h));break;case s.ANY:this.hasHit=!0,u.hasHit=!0,u.set(o,l,e,t,n,i,h),u.shouldStop=!0;break}}static pointInTriangle(e,t,n,i){i.vsub(t,Wi),n.vsub(t,Cr),e.vsub(t,Wc);let r=Wi.dot(Wi),o=Wi.dot(Cr),l=Wi.dot(Wc),h=Cr.dot(Cr),u=Cr.dot(Wc),a,c;return(a=h*l-o*u)>=0&&(c=r*u-o*l)>=0&&a+c<r*h-o*o}};un.CLOSEST=rh.CLOSEST;un.ANY=rh.ANY;un.ALL=rh.ALL;var Pd=new tn,Gc=[],Cr=new S,Wc=new S,D_=new S,F_=new Wt,$t=new S,Mn=new S,Nn=new S,Dn=new S;new S;new _i;var Ld={faceList:[0]},Ga=new S,B_=new un,U_=[],z_=new S,O_=new S,k_=new S,V_=new S,H_=new S,Nd=new S,G_=new S,W_=new S,q_=new S,X_=new S,Y_=new S,$_=new S;new tn;var Z_=[],j_=new Qe,Wi=new S,Wa=new S;function K_(s,e,t){t.vsub(s,Wi);let n=Wi.dot(e);return e.scale(n,Wa),Wa.vadd(s,Wa),t.distanceTo(Wa)}var Ka=class s extends ja{static checkBounds(e,t,n){let i,r;n===0?(i=e.position.x,r=t.position.x):n===1?(i=e.position.y,r=t.position.y):n===2&&(i=e.position.z,r=t.position.z);let o=e.boundingRadius,l=t.boundingRadius,h=i+o;return r-l<h}static insertionSortX(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],r;for(r=t-1;r>=0&&!(e[r].aabb.lowerBound.x<=i.aabb.lowerBound.x);r--)e[r+1]=e[r];e[r+1]=i}return e}static insertionSortY(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],r;for(r=t-1;r>=0&&!(e[r].aabb.lowerBound.y<=i.aabb.lowerBound.y);r--)e[r+1]=e[r];e[r+1]=i}return e}static insertionSortZ(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],r;for(r=t-1;r>=0&&!(e[r].aabb.lowerBound.z<=i.aabb.lowerBound.z);r--)e[r+1]=e[r];e[r+1]=i}return e}constructor(e){super(),this.axisList=[],this.world=null,this.axisIndex=0;let t=this.axisList;this._addBodyHandler=n=>{t.push(n.body)},this._removeBodyHandler=n=>{let i=t.indexOf(n.body);i!==-1&&t.splice(i,1)},e&&this.setWorld(e)}setWorld(e){this.axisList.length=0;for(let t=0;t<e.bodies.length;t++)this.axisList.push(e.bodies[t]);e.removeEventListener("addBody",this._addBodyHandler),e.removeEventListener("removeBody",this._removeBodyHandler),e.addEventListener("addBody",this._addBodyHandler),e.addEventListener("removeBody",this._removeBodyHandler),this.world=e,this.dirty=!0}collisionPairs(e,t,n){let i=this.axisList,r=i.length,o=this.axisIndex,l,h;for(this.dirty&&(this.sortList(),this.dirty=!1),l=0;l!==r;l++){let u=i[l];for(h=l+1;h<r;h++){let a=i[h];if(this.needBroadphaseCollision(u,a)){if(!s.checkBounds(u,a,o))break;this.intersectionTest(u,a,t,n)}}}}sortList(){let e=this.axisList,t=this.axisIndex,n=e.length;for(let i=0;i!==n;i++){let r=e[i];r.aabbNeedsUpdate&&r.updateAABB()}t===0?s.insertionSortX(e):t===1?s.insertionSortY(e):t===2&&s.insertionSortZ(e)}autoDetectAxis(){let e=0,t=0,n=0,i=0,r=0,o=0,l=this.axisList,h=l.length,u=1/h;for(let f=0;f!==h;f++){let m=l[f],x=m.position.x;e+=x,t+=x*x;let p=m.position.y;n+=p,i+=p*p;let g=m.position.z;r+=g,o+=g*g}let a=t-e*e*u,c=i-n*n*u,d=o-r*r*u;a>c?a>d?this.axisIndex=0:this.axisIndex=2:c>d?this.axisIndex=1:this.axisIndex=2}aabbQuery(e,t,n){n===void 0&&(n=[]),this.dirty&&(this.sortList(),this.dirty=!1);let i=this.axisIndex,r="x";i===1&&(r="y"),i===2&&(r="z");let o=this.axisList;t.lowerBound[r],t.upperBound[r];for(let l=0;l<o.length;l++){let h=o[l];h.aabbNeedsUpdate&&h.updateAABB(),h.aabb.overlaps(t)&&n.push(h)}return n}},Ja=class{static defaults(e,t){e===void 0&&(e={});for(let n in t)n in e||(e[n]=t[n]);return e}},Zc=class s{constructor(e,t,n){n===void 0&&(n={}),n=Ja.defaults(n,{collideConnected:!0,wakeUpBodies:!0}),this.equations=[],this.bodyA=e,this.bodyB=t,this.id=s.idCounter++,this.collideConnected=n.collideConnected,n.wakeUpBodies&&(e&&e.wakeUp(),t&&t.wakeUp())}update(){throw new Error("method update() not implmemented in this Constraint subclass!")}enable(){let e=this.equations;for(let t=0;t<e.length;t++)e[t].enabled=!0}disable(){let e=this.equations;for(let t=0;t<e.length;t++)e[t].enabled=!1}};Zc.idCounter=0;var Qa=class{constructor(){this.spatial=new S,this.rotational=new S}multiplyElement(e){return e.spatial.dot(this.spatial)+e.rotational.dot(this.rotational)}multiplyVectors(e,t){return e.dot(this.spatial)+t.dot(this.rotational)}},Nr=class s{constructor(e,t,n,i){n===void 0&&(n=-1e6),i===void 0&&(i=1e6),this.id=s.idCounter++,this.minForce=n,this.maxForce=i,this.bi=e,this.bj=t,this.a=0,this.b=0,this.eps=0,this.jacobianElementA=new Qa,this.jacobianElementB=new Qa,this.enabled=!0,this.multiplier=0,this.setSpookParams(1e7,4,1/60)}setSpookParams(e,t,n){let i=t,r=e,o=n;this.a=4/(o*(1+4*i)),this.b=4*i/(1+4*i),this.eps=4/(o*o*r*(1+4*i))}computeB(e,t,n){let i=this.computeGW(),r=this.computeGq(),o=this.computeGiMf();return-r*e-i*t-o*n}computeGq(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,r=n.position,o=i.position;return e.spatial.dot(r)+t.spatial.dot(o)}computeGW(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,r=n.velocity,o=i.velocity,l=n.angularVelocity,h=i.angularVelocity;return e.multiplyVectors(r,l)+t.multiplyVectors(o,h)}computeGWlambda(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,r=n.vlambda,o=i.vlambda,l=n.wlambda,h=i.wlambda;return e.multiplyVectors(r,l)+t.multiplyVectors(o,h)}computeGiMf(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,r=n.force,o=n.torque,l=i.force,h=i.torque,u=n.invMassSolve,a=i.invMassSolve;return r.scale(u,Dd),l.scale(a,Fd),n.invInertiaWorldSolve.vmult(o,Bd),i.invInertiaWorldSolve.vmult(h,Ud),e.multiplyVectors(Dd,Bd)+t.multiplyVectors(Fd,Ud)}computeGiMGt(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,r=n.invMassSolve,o=i.invMassSolve,l=n.invInertiaWorldSolve,h=i.invInertiaWorldSolve,u=r+o;return l.vmult(e.rotational,qa),u+=qa.dot(e.rotational),h.vmult(t.rotational,qa),u+=qa.dot(t.rotational),u}addToWlambda(e){let t=this.jacobianElementA,n=this.jacobianElementB,i=this.bi,r=this.bj,o=J_;i.vlambda.addScaledVector(i.invMassSolve*e,t.spatial,i.vlambda),r.vlambda.addScaledVector(r.invMassSolve*e,n.spatial,r.vlambda),i.invInertiaWorldSolve.vmult(t.rotational,o),i.wlambda.addScaledVector(e,o,i.wlambda),r.invInertiaWorldSolve.vmult(n.rotational,o),r.wlambda.addScaledVector(e,o,r.wlambda)}computeC(){return this.computeGiMGt()+this.eps}};Nr.idCounter=0;var Dd=new S,Fd=new S,Bd=new S,Ud=new S,qa=new S,J_=new S,jc=class extends Nr{constructor(e,t,n){n===void 0&&(n=1e6),super(e,t,0,n),this.restitution=0,this.ri=new S,this.rj=new S,this.ni=new S}computeB(e){let t=this.a,n=this.b,i=this.bi,r=this.bj,o=this.ri,l=this.rj,h=Q_,u=ev,a=i.velocity,c=i.angularVelocity;i.force,i.torque;let d=r.velocity,f=r.angularVelocity;r.force,r.torque;let m=tv,x=this.jacobianElementA,p=this.jacobianElementB,g=this.ni;o.cross(g,h),l.cross(g,u),g.negate(x.spatial),h.negate(x.rotational),p.spatial.copy(g),p.rotational.copy(u),m.copy(r.position),m.vadd(l,m),m.vsub(i.position,m),m.vsub(o,m);let _=g.dot(m),y=this.restitution+1,v=y*d.dot(g)-y*a.dot(g)+f.dot(u)-c.dot(h),T=this.computeGiMf();return-_*t-v*n-e*T}getImpactVelocityAlongNormal(){let e=nv,t=iv,n=sv,i=rv,r=ov;return this.bi.position.vadd(this.ri,n),this.bj.position.vadd(this.rj,i),this.bi.getVelocityAtWorldPoint(n,e),this.bj.getVelocityAtWorldPoint(i,t),e.vsub(t,r),this.ni.dot(r)}},Q_=new S,ev=new S,tv=new S,nv=new S,iv=new S,sv=new S,rv=new S,ov=new S;var $M=new S,ZM=new S;var jM=new S,KM=new S;new S;new S;var JM=new S,QM=new S;var eS=new S,tS=new S,el=class extends Nr{constructor(e,t,n){super(e,t,-n,n),this.ri=new S,this.rj=new S,this.t=new S}computeB(e){this.a;let t=this.b;this.bi,this.bj;let n=this.ri,i=this.rj,r=av,o=lv,l=this.t;n.cross(l,r),i.cross(l,o);let h=this.jacobianElementA,u=this.jacobianElementB;l.negate(h.spatial),r.negate(h.rotational),u.spatial.copy(l),u.rotational.copy(o);let a=this.computeGW(),c=this.computeGiMf();return-a*t-e*c}},av=new S,lv=new S,tl=class s{constructor(e,t,n){n=Ja.defaults(n,{friction:.3,restitution:.3,contactEquationStiffness:1e7,contactEquationRelaxation:3,frictionEquationStiffness:1e7,frictionEquationRelaxation:3}),this.id=s.idCounter++,this.materials=[e,t],this.friction=n.friction,this.restitution=n.restitution,this.contactEquationStiffness=n.contactEquationStiffness,this.contactEquationRelaxation=n.contactEquationRelaxation,this.frictionEquationStiffness=n.frictionEquationStiffness,this.frictionEquationRelaxation=n.frictionEquationRelaxation}};tl.idCounter=0;var nl=class s{constructor(e){e===void 0&&(e={});let t="";typeof e=="string"&&(t=e,e={}),this.name=t,this.id=s.idCounter++,this.friction=typeof e.friction<"u"?e.friction:-1,this.restitution=typeof e.restitution<"u"?e.restitution:-1}};nl.idCounter=0;var nS=new S,iS=new S,sS=new S,rS=new S,oS=new S,aS=new S,lS=new S,cS=new S,hS=new S,uS=new S,dS=new S;var fS=new S,pS=new S;new S;new S;new S;var mS=new S,gS=new S,xS=new S;new un;new S;var _S=new S,vS=new S,yS=[new S(1,0,0),new S(0,1,0),new S(0,0,1)],bS=new S;var wS=new S,MS=new S,SS=new S;var AS=new S,TS=new S,ES=new S,CS=new S;var RS=new S,IS=new S,PS=new S;var il=class extends me{constructor(e){if(super({type:me.types.SPHERE}),this.radius=e!==void 0?e:1,this.radius<0)throw new Error("The sphere radius cannot be negative.");this.updateBoundingSphereRadius()}calculateLocalInertia(e,t){t===void 0&&(t=new S);let n=2*e*this.radius*this.radius/5;return t.x=n,t.y=n,t.z=n,t}volume(){return 4*Math.PI*Math.pow(this.radius,3)/3}updateBoundingSphereRadius(){this.boundingSphereRadius=this.radius}calculateWorldAABB(e,t,n,i){let r=this.radius,o=["x","y","z"];for(let l=0;l<o.length;l++){let h=o[l];n[h]=e[h]-r,i[h]=e[h]+r}}};var LS=new S,NS=new S;var DS=new S,FS=new S,BS=new S,US=new S,zS=new S,OS=new S,kS=new S;var VS=new S;var HS=new S,GS=new S,WS=new S,qS=new S,XS=new S,YS=new S,$S=new S,ZS=new S,jS=new S;var KS=new S,JS=new tn;var QS=new S,e1=new tn,t1=new S,n1=new S,i1=new S,s1=new S,r1=new S,o1=new S,a1=new S,l1=new tn,c1=new S,h1=new Qe,u1=new tn,Kc=class{constructor(){this.equations=[]}solve(e,t){return 0}addEquation(e){e.enabled&&!e.bi.isTrigger&&!e.bj.isTrigger&&this.equations.push(e)}removeEquation(e){let t=this.equations,n=t.indexOf(e);n!==-1&&t.splice(n,1)}removeAllEquations(){this.equations.length=0}},Jc=class extends Kc{constructor(){super(),this.iterations=10,this.tolerance=1e-7}solve(e,t){let n=0,i=this.iterations,r=this.tolerance*this.tolerance,o=this.equations,l=o.length,h=t.bodies,u=h.length,a=e,c,d,f,m,x,p;if(l!==0)for(let v=0;v!==u;v++)h[v].updateSolveMassProperties();let g=hv,_=uv,y=cv;g.length=l,_.length=l,y.length=l;for(let v=0;v!==l;v++){let T=o[v];y[v]=0,_[v]=T.computeB(a),g[v]=1/T.computeC()}if(l!==0){for(let A=0;A!==u;A++){let C=h[A],R=C.vlambda,M=C.wlambda;R.set(0,0,0),M.set(0,0,0)}for(n=0;n!==i;n++){m=0;for(let A=0;A!==l;A++){let C=o[A];c=_[A],d=g[A],p=y[A],x=C.computeGWlambda(),f=d*(c-x-C.eps*p),p+f<C.minForce?f=C.minForce-p:p+f>C.maxForce&&(f=C.maxForce-p),y[A]+=f,m+=f>0?f:-f,C.addToWlambda(f)}if(m*m<r)break}for(let A=0;A!==u;A++){let C=h[A],R=C.velocity,M=C.angularVelocity;C.vlambda.vmul(C.linearFactor,C.vlambda),R.vadd(C.vlambda,R),C.wlambda.vmul(C.angularFactor,C.wlambda),M.vadd(C.wlambda,M)}let v=o.length,T=1/a;for(;v--;)o[v].multiplier=y[v]*T}return n}},cv=[],hv=[],uv=[];var d1=Ge.STATIC;var Qc=class{constructor(){this.objects=[],this.type=Object}release(){let e=arguments.length;for(let t=0;t!==e;t++)this.objects.push(t<0||arguments.length<=t?void 0:arguments[t]);return this}get(){return this.objects.length===0?this.constructObject():this.objects.pop()}constructObject(){throw new Error("constructObject() not implemented in this Pool subclass yet!")}resize(e){let t=this.objects;for(;t.length>e;)t.pop();for(;t.length<e;)t.push(this.constructObject());return this}},eh=class extends Qc{constructor(){super(...arguments),this.type=S}constructObject(){return new S}},ut={sphereSphere:me.types.SPHERE,spherePlane:me.types.SPHERE|me.types.PLANE,boxBox:me.types.BOX|me.types.BOX,sphereBox:me.types.SPHERE|me.types.BOX,planeBox:me.types.PLANE|me.types.BOX,convexConvex:me.types.CONVEXPOLYHEDRON,sphereConvex:me.types.SPHERE|me.types.CONVEXPOLYHEDRON,planeConvex:me.types.PLANE|me.types.CONVEXPOLYHEDRON,boxConvex:me.types.BOX|me.types.CONVEXPOLYHEDRON,sphereHeightfield:me.types.SPHERE|me.types.HEIGHTFIELD,boxHeightfield:me.types.BOX|me.types.HEIGHTFIELD,convexHeightfield:me.types.CONVEXPOLYHEDRON|me.types.HEIGHTFIELD,sphereParticle:me.types.PARTICLE|me.types.SPHERE,planeParticle:me.types.PLANE|me.types.PARTICLE,boxParticle:me.types.BOX|me.types.PARTICLE,convexParticle:me.types.PARTICLE|me.types.CONVEXPOLYHEDRON,cylinderCylinder:me.types.CYLINDER,sphereCylinder:me.types.SPHERE|me.types.CYLINDER,planeCylinder:me.types.PLANE|me.types.CYLINDER,boxCylinder:me.types.BOX|me.types.CYLINDER,convexCylinder:me.types.CONVEXPOLYHEDRON|me.types.CYLINDER,heightfieldCylinder:me.types.HEIGHTFIELD|me.types.CYLINDER,particleCylinder:me.types.PARTICLE|me.types.CYLINDER,sphereTrimesh:me.types.SPHERE|me.types.TRIMESH,planeTrimesh:me.types.PLANE|me.types.TRIMESH},th=class{get[ut.sphereSphere](){return this.sphereSphere}get[ut.spherePlane](){return this.spherePlane}get[ut.boxBox](){return this.boxBox}get[ut.sphereBox](){return this.sphereBox}get[ut.planeBox](){return this.planeBox}get[ut.convexConvex](){return this.convexConvex}get[ut.sphereConvex](){return this.sphereConvex}get[ut.planeConvex](){return this.planeConvex}get[ut.boxConvex](){return this.boxConvex}get[ut.sphereHeightfield](){return this.sphereHeightfield}get[ut.boxHeightfield](){return this.boxHeightfield}get[ut.convexHeightfield](){return this.convexHeightfield}get[ut.sphereParticle](){return this.sphereParticle}get[ut.planeParticle](){return this.planeParticle}get[ut.boxParticle](){return this.boxParticle}get[ut.convexParticle](){return this.convexParticle}get[ut.cylinderCylinder](){return this.convexConvex}get[ut.sphereCylinder](){return this.sphereConvex}get[ut.planeCylinder](){return this.planeConvex}get[ut.boxCylinder](){return this.boxConvex}get[ut.convexCylinder](){return this.convexConvex}get[ut.heightfieldCylinder](){return this.heightfieldCylinder}get[ut.particleCylinder](){return this.particleCylinder}get[ut.sphereTrimesh](){return this.sphereTrimesh}get[ut.planeTrimesh](){return this.planeTrimesh}constructor(e){this.contactPointPool=[],this.frictionEquationPool=[],this.result=[],this.frictionResult=[],this.v3pool=new eh,this.world=e,this.currentContactMaterial=e.defaultContactMaterial,this.enableFrictionReduction=!1}createContactEquation(e,t,n,i,r,o){let l;this.contactPointPool.length?(l=this.contactPointPool.pop(),l.bi=e,l.bj=t):l=new jc(e,t),l.enabled=e.collisionResponse&&t.collisionResponse&&n.collisionResponse&&i.collisionResponse;let h=this.currentContactMaterial;l.restitution=h.restitution,l.setSpookParams(h.contactEquationStiffness,h.contactEquationRelaxation,this.world.dt);let u=n.material||e.material,a=i.material||t.material;return u&&a&&u.restitution>=0&&a.restitution>=0&&(l.restitution=u.restitution*a.restitution),l.si=r||n,l.sj=o||i,l}createFrictionEquationsFromContact(e,t){let n=e.bi,i=e.bj,r=e.si,o=e.sj,l=this.world,h=this.currentContactMaterial,u=h.friction,a=r.material||n.material,c=o.material||i.material;if(a&&c&&a.friction>=0&&c.friction>=0&&(u=a.friction*c.friction),u>0){let d=u*(l.frictionGravity||l.gravity).length(),f=n.invMass+i.invMass;f>0&&(f=1/f);let m=this.frictionEquationPool,x=m.length?m.pop():new el(n,i,d*f),p=m.length?m.pop():new el(n,i,d*f);return x.bi=p.bi=n,x.bj=p.bj=i,x.minForce=p.minForce=-d*f,x.maxForce=p.maxForce=d*f,x.ri.copy(e.ri),x.rj.copy(e.rj),p.ri.copy(e.ri),p.rj.copy(e.rj),e.ni.tangents(x.t,p.t),x.setSpookParams(h.frictionEquationStiffness,h.frictionEquationRelaxation,l.dt),p.setSpookParams(h.frictionEquationStiffness,h.frictionEquationRelaxation,l.dt),x.enabled=p.enabled=e.enabled,t.push(x,p),!0}return!1}createFrictionFromAverage(e){let t=this.result[this.result.length-1];if(!this.createFrictionEquationsFromContact(t,this.frictionResult)||e===1)return;let n=this.frictionResult[this.frictionResult.length-2],i=this.frictionResult[this.frictionResult.length-1];Gi.setZero(),Cs.setZero(),Rs.setZero();let r=t.bi;t.bj;for(let l=0;l!==e;l++)t=this.result[this.result.length-1-l],t.bi!==r?(Gi.vadd(t.ni,Gi),Cs.vadd(t.ri,Cs),Rs.vadd(t.rj,Rs)):(Gi.vsub(t.ni,Gi),Cs.vadd(t.rj,Cs),Rs.vadd(t.ri,Rs));let o=1/e;Cs.scale(o,n.ri),Rs.scale(o,n.rj),i.ri.copy(n.ri),i.rj.copy(n.rj),Gi.normalize(),Gi.tangents(n.t,i.t)}getContacts(e,t,n,i,r,o,l){this.contactPointPool=r,this.frictionEquationPool=l,this.result=i,this.frictionResult=o;let h=pv,u=mv,a=dv,c=fv;for(let d=0,f=e.length;d!==f;d++){let m=e[d],x=t[d],p=null;m.material&&x.material&&(p=n.getContactMaterial(m.material,x.material)||null);let g=m.type&Ge.KINEMATIC&&x.type&Ge.STATIC||m.type&Ge.STATIC&&x.type&Ge.KINEMATIC||m.type&Ge.KINEMATIC&&x.type&Ge.KINEMATIC;for(let _=0;_<m.shapes.length;_++){m.quaternion.mult(m.shapeOrientations[_],h),m.quaternion.vmult(m.shapeOffsets[_],a),a.vadd(m.position,a);let y=m.shapes[_];for(let v=0;v<x.shapes.length;v++){x.quaternion.mult(x.shapeOrientations[v],u),x.quaternion.vmult(x.shapeOffsets[v],c),c.vadd(x.position,c);let T=x.shapes[v];if(!(y.collisionFilterMask&T.collisionFilterGroup&&T.collisionFilterMask&y.collisionFilterGroup)||a.distanceTo(c)>y.boundingSphereRadius+T.boundingSphereRadius)continue;let A=null;y.material&&T.material&&(A=n.getContactMaterial(y.material,T.material)||null),this.currentContactMaterial=A||p||n.defaultContactMaterial;let C=y.type|T.type,R=this[C];if(R){let M=!1;y.type<T.type?M=R.call(this,y,T,a,c,h,u,m,x,y,T,g):M=R.call(this,T,y,c,a,u,h,x,m,y,T,g),M&&g&&(n.shapeOverlapKeeper.set(y.id,T.id),n.bodyOverlapKeeper.set(m.id,x.id))}}}}}sphereSphere(e,t,n,i,r,o,l,h,u,a,c){if(c)return n.distanceSquared(i)<(e.radius+t.radius)**2;let d=this.createContactEquation(l,h,e,t,u,a);i.vsub(n,d.ni),d.ni.normalize(),d.ri.copy(d.ni),d.rj.copy(d.ni),d.ri.scale(e.radius,d.ri),d.rj.scale(-t.radius,d.rj),d.ri.vadd(n,d.ri),d.ri.vsub(l.position,d.ri),d.rj.vadd(i,d.rj),d.rj.vsub(h.position,d.rj),this.result.push(d),this.createFrictionEquationsFromContact(d,this.frictionResult)}spherePlane(e,t,n,i,r,o,l,h,u,a,c){let d=this.createContactEquation(l,h,e,t,u,a);if(d.ni.set(0,0,1),o.vmult(d.ni,d.ni),d.ni.negate(d.ni),d.ni.normalize(),d.ni.scale(e.radius,d.ri),n.vsub(i,Xa),d.ni.scale(d.ni.dot(Xa),zd),Xa.vsub(zd,d.rj),-Xa.dot(d.ni)<=e.radius){if(c)return!0;let f=d.ri,m=d.rj;f.vadd(n,f),f.vsub(l.position,f),m.vadd(i,m),m.vsub(h.position,m),this.result.push(d),this.createFrictionEquationsFromContact(d,this.frictionResult)}}boxBox(e,t,n,i,r,o,l,h,u,a,c){return e.convexPolyhedronRepresentation.material=e.material,t.convexPolyhedronRepresentation.material=t.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,this.convexConvex(e.convexPolyhedronRepresentation,t.convexPolyhedronRepresentation,n,i,r,o,l,h,e,t,c)}sphereBox(e,t,n,i,r,o,l,h,u,a,c){let d=this.v3pool,f=Vv;n.vsub(i,Ya),t.getSideNormals(f,o);let m=e.radius,x=!1,p=Gv,g=Wv,_=qv,y=null,v=0,T=0,A=0,C=null;for(let D=0,j=f.length;D!==j&&x===!1;D++){let H=zv;H.copy(f[D]);let Z=H.length();H.normalize();let ae=Ya.dot(H);if(ae<Z+m&&ae>0){let de=Ov,re=kv;de.copy(f[(D+1)%3]),re.copy(f[(D+2)%3]);let Ze=de.length(),et=re.length();de.normalize(),re.normalize();let Ye=Ya.dot(de),$=Ya.dot(re);if(Ye<Ze&&Ye>-Ze&&$<et&&$>-et){let Q=Math.abs(ae-Z-m);if((C===null||Q<C)&&(C=Q,T=Ye,A=$,y=Z,p.copy(H),g.copy(de),_.copy(re),v++,c))return!0}}}if(v){x=!0;let D=this.createContactEquation(l,h,e,t,u,a);p.scale(-m,D.ri),D.ni.copy(p),D.ni.negate(D.ni),p.scale(y,p),g.scale(T,g),p.vadd(g,p),_.scale(A,_),p.vadd(_,D.rj),D.ri.vadd(n,D.ri),D.ri.vsub(l.position,D.ri),D.rj.vadd(i,D.rj),D.rj.vsub(h.position,D.rj),this.result.push(D),this.createFrictionEquationsFromContact(D,this.frictionResult)}let R=d.get(),M=Hv;for(let D=0;D!==2&&!x;D++)for(let j=0;j!==2&&!x;j++)for(let H=0;H!==2&&!x;H++)if(R.set(0,0,0),D?R.vadd(f[0],R):R.vsub(f[0],R),j?R.vadd(f[1],R):R.vsub(f[1],R),H?R.vadd(f[2],R):R.vsub(f[2],R),i.vadd(R,M),M.vsub(n,M),M.lengthSquared()<m*m){if(c)return!0;x=!0;let Z=this.createContactEquation(l,h,e,t,u,a);Z.ri.copy(M),Z.ri.normalize(),Z.ni.copy(Z.ri),Z.ri.scale(m,Z.ri),Z.rj.copy(R),Z.ri.vadd(n,Z.ri),Z.ri.vsub(l.position,Z.ri),Z.rj.vadd(i,Z.rj),Z.rj.vsub(h.position,Z.rj),this.result.push(Z),this.createFrictionEquationsFromContact(Z,this.frictionResult)}d.release(R),R=null;let b=d.get(),P=d.get(),B=d.get(),L=d.get(),U=d.get(),O=f.length;for(let D=0;D!==O&&!x;D++)for(let j=0;j!==O&&!x;j++)if(D%3!==j%3){f[j].cross(f[D],b),b.normalize(),f[D].vadd(f[j],P),B.copy(n),B.vsub(P,B),B.vsub(i,B);let H=B.dot(b);b.scale(H,L);let Z=0;for(;Z===D%3||Z===j%3;)Z++;U.copy(n),U.vsub(L,U),U.vsub(P,U),U.vsub(i,U);let ae=Math.abs(H),de=U.length();if(ae<f[Z].length()&&de<m){if(c)return!0;x=!0;let re=this.createContactEquation(l,h,e,t,u,a);P.vadd(L,re.rj),re.rj.copy(re.rj),U.negate(re.ni),re.ni.normalize(),re.ri.copy(re.rj),re.ri.vadd(i,re.ri),re.ri.vsub(n,re.ri),re.ri.normalize(),re.ri.scale(m,re.ri),re.ri.vadd(n,re.ri),re.ri.vsub(l.position,re.ri),re.rj.vadd(i,re.rj),re.rj.vsub(h.position,re.rj),this.result.push(re),this.createFrictionEquationsFromContact(re,this.frictionResult)}}d.release(b,P,B,L,U)}planeBox(e,t,n,i,r,o,l,h,u,a,c){return t.convexPolyhedronRepresentation.material=t.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,t.convexPolyhedronRepresentation.id=t.id,this.planeConvex(e,t.convexPolyhedronRepresentation,n,i,r,o,l,h,e,t,c)}convexConvex(e,t,n,i,r,o,l,h,u,a,c,d,f){let m=oy;if(!(n.distanceTo(i)>e.boundingSphereRadius+t.boundingSphereRadius)&&e.findSeparatingAxis(t,n,r,i,o,m,d,f)){let x=[],p=ay;e.clipAgainstHull(n,r,t,i,o,m,-100,100,x);let g=0;for(let _=0;_!==x.length;_++){if(c)return!0;let y=this.createContactEquation(l,h,e,t,u,a),v=y.ri,T=y.rj;m.negate(y.ni),x[_].normal.negate(p),p.scale(x[_].depth,p),x[_].point.vadd(p,v),T.copy(x[_].point),v.vsub(n,v),T.vsub(i,T),v.vadd(n,v),v.vsub(l.position,v),T.vadd(i,T),T.vsub(h.position,T),this.result.push(y),g++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(y,this.frictionResult)}this.enableFrictionReduction&&g&&this.createFrictionFromAverage(g)}}sphereConvex(e,t,n,i,r,o,l,h,u,a,c){let d=this.v3pool;n.vsub(i,Xv);let f=t.faceNormals,m=t.faces,x=t.vertices,p=e.radius,g=!1;for(let _=0;_!==x.length;_++){let y=x[_],v=jv;o.vmult(y,v),i.vadd(v,v);let T=Zv;if(v.vsub(n,T),T.lengthSquared()<p*p){if(c)return!0;g=!0;let A=this.createContactEquation(l,h,e,t,u,a);A.ri.copy(T),A.ri.normalize(),A.ni.copy(A.ri),A.ri.scale(p,A.ri),v.vsub(i,A.rj),A.ri.vadd(n,A.ri),A.ri.vsub(l.position,A.ri),A.rj.vadd(i,A.rj),A.rj.vsub(h.position,A.rj),this.result.push(A),this.createFrictionEquationsFromContact(A,this.frictionResult);return}}for(let _=0,y=m.length;_!==y&&g===!1;_++){let v=f[_],T=m[_],A=Kv;o.vmult(v,A);let C=Jv;o.vmult(x[T[0]],C),C.vadd(i,C);let R=Qv;A.scale(-p,R),n.vadd(R,R);let M=ey;R.vsub(C,M);let b=M.dot(A),P=ty;if(n.vsub(C,P),b<0&&P.dot(A)>0){let B=[];for(let L=0,U=T.length;L!==U;L++){let O=d.get();o.vmult(x[T[L]],O),i.vadd(O,O),B.push(O)}if(Uv(B,A,n)){if(c)return!0;g=!0;let L=this.createContactEquation(l,h,e,t,u,a);A.scale(-p,L.ri),A.negate(L.ni);let U=d.get();A.scale(-b,U);let O=d.get();A.scale(-p,O),n.vsub(i,L.rj),L.rj.vadd(O,L.rj),L.rj.vadd(U,L.rj),L.rj.vadd(i,L.rj),L.rj.vsub(h.position,L.rj),L.ri.vadd(n,L.ri),L.ri.vsub(l.position,L.ri),d.release(U),d.release(O),this.result.push(L),this.createFrictionEquationsFromContact(L,this.frictionResult);for(let D=0,j=B.length;D!==j;D++)d.release(B[D]);return}else for(let L=0;L!==T.length;L++){let U=d.get(),O=d.get();o.vmult(x[T[(L+1)%T.length]],U),o.vmult(x[T[(L+2)%T.length]],O),i.vadd(U,U),i.vadd(O,O);let D=Yv;O.vsub(U,D);let j=$v;D.unit(j);let H=d.get(),Z=d.get();n.vsub(U,Z);let ae=Z.dot(j);j.scale(ae,H),H.vadd(U,H);let de=d.get();if(H.vsub(n,de),ae>0&&ae*ae<D.lengthSquared()&&de.lengthSquared()<p*p){if(c)return!0;let re=this.createContactEquation(l,h,e,t,u,a);H.vsub(i,re.rj),H.vsub(n,re.ni),re.ni.normalize(),re.ni.scale(p,re.ri),re.rj.vadd(i,re.rj),re.rj.vsub(h.position,re.rj),re.ri.vadd(n,re.ri),re.ri.vsub(l.position,re.ri),this.result.push(re),this.createFrictionEquationsFromContact(re,this.frictionResult);for(let Ze=0,et=B.length;Ze!==et;Ze++)d.release(B[Ze]);d.release(U),d.release(O),d.release(H),d.release(de),d.release(Z);return}d.release(U),d.release(O),d.release(H),d.release(de),d.release(Z)}for(let L=0,U=B.length;L!==U;L++)d.release(B[L])}}}planeConvex(e,t,n,i,r,o,l,h,u,a,c){let d=ny,f=iy;f.set(0,0,1),r.vmult(f,f);let m=0,x=sy;for(let p=0;p!==t.vertices.length;p++)if(d.copy(t.vertices[p]),o.vmult(d,d),i.vadd(d,d),d.vsub(n,x),f.dot(x)<=0){if(c)return!0;let _=this.createContactEquation(l,h,e,t,u,a),y=ry;f.scale(f.dot(x),y),d.vsub(y,y),y.vsub(n,_.ri),_.ni.copy(f),d.vsub(i,_.rj),_.ri.vadd(n,_.ri),_.ri.vsub(l.position,_.ri),_.rj.vadd(i,_.rj),_.rj.vsub(h.position,_.rj),this.result.push(_),m++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(_,this.frictionResult)}this.enableFrictionReduction&&m&&this.createFrictionFromAverage(m)}boxConvex(e,t,n,i,r,o,l,h,u,a,c){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexConvex(e.convexPolyhedronRepresentation,t,n,i,r,o,l,h,e,t,c)}sphereHeightfield(e,t,n,i,r,o,l,h,u,a,c){let d=t.data,f=e.radius,m=t.elementSize,x=vy,p=_y;Qe.pointToLocalFrame(i,o,n,p);let g=Math.floor((p.x-f)/m)-1,_=Math.ceil((p.x+f)/m)+1,y=Math.floor((p.y-f)/m)-1,v=Math.ceil((p.y+f)/m)+1;if(_<0||v<0||g>d.length||y>d[0].length)return;g<0&&(g=0),_<0&&(_=0),y<0&&(y=0),v<0&&(v=0),g>=d.length&&(g=d.length-1),_>=d.length&&(_=d.length-1),v>=d[0].length&&(v=d[0].length-1),y>=d[0].length&&(y=d[0].length-1);let T=[];t.getRectMinMax(g,y,_,v,T);let A=T[0],C=T[1];if(p.z-f>C||p.z+f<A)return;let R=this.result;for(let M=g;M<_;M++)for(let b=y;b<v;b++){let P=R.length,B=!1;if(t.getConvexTrianglePillar(M,b,!1),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(B=this.sphereConvex(e,t.pillarConvex,n,x,r,o,l,h,e,t,c)),c&&B||(t.getConvexTrianglePillar(M,b,!0),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(B=this.sphereConvex(e,t.pillarConvex,n,x,r,o,l,h,e,t,c)),c&&B))return!0;if(R.length-P>2)return}}boxHeightfield(e,t,n,i,r,o,l,h,u,a,c){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexHeightfield(e.convexPolyhedronRepresentation,t,n,i,r,o,l,h,e,t,c)}convexHeightfield(e,t,n,i,r,o,l,h,u,a,c){let d=t.data,f=t.elementSize,m=e.boundingSphereRadius,x=gy,p=xy,g=my;Qe.pointToLocalFrame(i,o,n,g);let _=Math.floor((g.x-m)/f)-1,y=Math.ceil((g.x+m)/f)+1,v=Math.floor((g.y-m)/f)-1,T=Math.ceil((g.y+m)/f)+1;if(y<0||T<0||_>d.length||v>d[0].length)return;_<0&&(_=0),y<0&&(y=0),v<0&&(v=0),T<0&&(T=0),_>=d.length&&(_=d.length-1),y>=d.length&&(y=d.length-1),T>=d[0].length&&(T=d[0].length-1),v>=d[0].length&&(v=d[0].length-1);let A=[];t.getRectMinMax(_,v,y,T,A);let C=A[0],R=A[1];if(!(g.z-m>R||g.z+m<C))for(let M=_;M<y;M++)for(let b=v;b<T;b++){let P=!1;if(t.getConvexTrianglePillar(M,b,!1),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(P=this.convexConvex(e,t.pillarConvex,n,x,r,o,l,h,null,null,c,p,null)),c&&P||(t.getConvexTrianglePillar(M,b,!0),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(P=this.convexConvex(e,t.pillarConvex,n,x,r,o,l,h,null,null,c,p,null)),c&&P))return!0}}sphereParticle(e,t,n,i,r,o,l,h,u,a,c){let d=uy;if(d.set(0,0,1),i.vsub(n,d),d.lengthSquared()<=e.radius*e.radius){if(c)return!0;let m=this.createContactEquation(h,l,t,e,u,a);d.normalize(),m.rj.copy(d),m.rj.scale(e.radius,m.rj),m.ni.copy(d),m.ni.negate(m.ni),m.ri.set(0,0,0),this.result.push(m),this.createFrictionEquationsFromContact(m,this.frictionResult)}}planeParticle(e,t,n,i,r,o,l,h,u,a,c){let d=ly;d.set(0,0,1),l.quaternion.vmult(d,d);let f=cy;if(i.vsub(l.position,f),d.dot(f)<=0){if(c)return!0;let x=this.createContactEquation(h,l,t,e,u,a);x.ni.copy(d),x.ni.negate(x.ni),x.ri.set(0,0,0);let p=hy;d.scale(d.dot(i),p),i.vsub(p,p),x.rj.copy(p),this.result.push(x),this.createFrictionEquationsFromContact(x,this.frictionResult)}}boxParticle(e,t,n,i,r,o,l,h,u,a,c){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexParticle(e.convexPolyhedronRepresentation,t,n,i,r,o,l,h,e,t,c)}convexParticle(e,t,n,i,r,o,l,h,u,a,c){let d=-1,f=fy,m=py,x=null,p=dy;if(p.copy(i),p.vsub(n,p),r.conjugate(Od),Od.vmult(p,p),e.pointIsInside(p)){e.worldVerticesNeedsUpdate&&e.computeWorldVertices(n,r),e.worldFaceNormalsNeedsUpdate&&e.computeWorldFaceNormals(r);for(let g=0,_=e.faces.length;g!==_;g++){let y=[e.worldVertices[e.faces[g][0]]],v=e.worldFaceNormals[g];i.vsub(y[0],kd);let T=-v.dot(kd);if(x===null||Math.abs(T)<Math.abs(x)){if(c)return!0;x=T,d=g,f.copy(v)}}if(d!==-1){let g=this.createContactEquation(h,l,t,e,u,a);f.scale(x,m),m.vadd(i,m),m.vsub(n,m),g.rj.copy(m),f.negate(g.ni),g.ri.set(0,0,0);let _=g.ri,y=g.rj;_.vadd(i,_),_.vsub(h.position,_),y.vadd(n,y),y.vsub(l.position,y),this.result.push(g),this.createFrictionEquationsFromContact(g,this.frictionResult)}else console.warn("Point found inside convex, but did not find penetrating face!")}}heightfieldCylinder(e,t,n,i,r,o,l,h,u,a,c){return this.convexHeightfield(t,e,i,n,o,r,h,l,u,a,c)}particleCylinder(e,t,n,i,r,o,l,h,u,a,c){return this.convexParticle(t,e,i,n,o,r,h,l,u,a,c)}sphereTrimesh(e,t,n,i,r,o,l,h,u,a,c){let d=Mv,f=Sv,m=Av,x=Tv,p=Ev,g=Cv,_=Lv,y=wv,v=yv,T=Nv;Qe.pointToLocalFrame(i,o,n,p);let A=e.radius;_.lowerBound.set(p.x-A,p.y-A,p.z-A),_.upperBound.set(p.x+A,p.y+A,p.z+A),t.getTrianglesInAABB(_,T);let C=bv,R=e.radius*e.radius;for(let L=0;L<T.length;L++)for(let U=0;U<3;U++)if(t.getVertex(t.indices[T[L]*3+U],C),C.vsub(p,v),v.lengthSquared()<=R){if(y.copy(C),Qe.pointToWorldFrame(i,o,y,C),C.vsub(n,v),c)return!0;let O=this.createContactEquation(l,h,e,t,u,a);O.ni.copy(v),O.ni.normalize(),O.ri.copy(O.ni),O.ri.scale(e.radius,O.ri),O.ri.vadd(n,O.ri),O.ri.vsub(l.position,O.ri),O.rj.copy(C),O.rj.vsub(h.position,O.rj),this.result.push(O),this.createFrictionEquationsFromContact(O,this.frictionResult)}for(let L=0;L<T.length;L++)for(let U=0;U<3;U++){t.getVertex(t.indices[T[L]*3+U],d),t.getVertex(t.indices[T[L]*3+(U+1)%3],f),f.vsub(d,m),p.vsub(f,g);let O=g.dot(m);p.vsub(d,g);let D=g.dot(m);if(D>0&&O<0&&(p.vsub(d,g),x.copy(m),x.normalize(),D=g.dot(x),x.scale(D,g),g.vadd(d,g),g.distanceTo(p)<e.radius)){if(c)return!0;let H=this.createContactEquation(l,h,e,t,u,a);g.vsub(p,H.ni),H.ni.normalize(),H.ni.scale(e.radius,H.ri),H.ri.vadd(n,H.ri),H.ri.vsub(l.position,H.ri),Qe.pointToWorldFrame(i,o,g,g),g.vsub(h.position,H.rj),Qe.vectorToWorldFrame(o,H.ni,H.ni),Qe.vectorToWorldFrame(o,H.ri,H.ri),this.result.push(H),this.createFrictionEquationsFromContact(H,this.frictionResult)}}let M=Rv,b=Iv,P=Pv,B=vv;for(let L=0,U=T.length;L!==U;L++){t.getTriangleVertices(T[L],M,b,P),t.getNormal(T[L],B),p.vsub(M,g);let O=g.dot(B);if(B.scale(O,g),p.vsub(g,g),O=g.distanceTo(p),un.pointInTriangle(g,M,b,P)&&O<e.radius){if(c)return!0;let D=this.createContactEquation(l,h,e,t,u,a);g.vsub(p,D.ni),D.ni.normalize(),D.ni.scale(e.radius,D.ri),D.ri.vadd(n,D.ri),D.ri.vsub(l.position,D.ri),Qe.pointToWorldFrame(i,o,g,g),g.vsub(h.position,D.rj),Qe.vectorToWorldFrame(o,D.ni,D.ni),Qe.vectorToWorldFrame(o,D.ri,D.ri),this.result.push(D),this.createFrictionEquationsFromContact(D,this.frictionResult)}}T.length=0}planeTrimesh(e,t,n,i,r,o,l,h,u,a,c){let d=new S,f=gv;f.set(0,0,1),r.vmult(f,f);for(let m=0;m<t.vertices.length/3;m++){t.getVertex(m,d);let x=new S;x.copy(d),Qe.pointToWorldFrame(i,o,x,d);let p=xv;if(d.vsub(n,p),f.dot(p)<=0){if(c)return!0;let _=this.createContactEquation(l,h,e,t,u,a);_.ni.copy(f);let y=_v;f.scale(p.dot(f),y),d.vsub(y,y),_.ri.copy(y),_.ri.vsub(l.position,_.ri),_.rj.copy(d),_.rj.vsub(h.position,_.rj),this.result.push(_),this.createFrictionEquationsFromContact(_,this.frictionResult)}}}},Gi=new S,Cs=new S,Rs=new S,dv=new S,fv=new S,pv=new Wt,mv=new Wt,gv=new S,xv=new S,_v=new S,vv=new S,yv=new S;new S;var bv=new S,wv=new S,Mv=new S,Sv=new S,Av=new S,Tv=new S,Ev=new S,Cv=new S,Rv=new S,Iv=new S,Pv=new S,Lv=new tn,Nv=[],Xa=new S,zd=new S,Dv=new S,Fv=new S,Bv=new S;function Uv(s,e,t){let n=null,i=s.length;for(let r=0;r!==i;r++){let o=s[r],l=Dv;s[(r+1)%i].vsub(o,l);let h=Fv;l.cross(e,h);let u=Bv;t.vsub(o,u);let a=h.dot(u);if(n===null||a>0&&n===!0||a<=0&&n===!1){n===null&&(n=a>0);continue}else return!1}return!0}var Ya=new S,zv=new S,Ov=new S,kv=new S,Vv=[new S,new S,new S,new S,new S,new S],Hv=new S,Gv=new S,Wv=new S,qv=new S,Xv=new S,Yv=new S,$v=new S,Zv=new S,jv=new S,Kv=new S,Jv=new S,Qv=new S,ey=new S,ty=new S;new S;new S;var ny=new S,iy=new S,sy=new S,ry=new S,oy=new S,ay=new S,ly=new S,cy=new S,hy=new S,uy=new S,Od=new Wt,dy=new S;new S;var fy=new S,kd=new S,py=new S,my=new S,gy=new S,xy=[0],_y=new S,vy=new S,sl=class{constructor(){this.current=[],this.previous=[]}getKey(e,t){if(t<e){let n=t;t=e,e=n}return e<<16|t}set(e,t){let n=this.getKey(e,t),i=this.current,r=0;for(;n>i[r];)r++;if(n!==i[r]){for(let o=i.length-1;o>=r;o--)i[o+1]=i[o];i[r]=n}}tick(){let e=this.current;this.current=this.previous,this.previous=e,this.current.length=0}getDiff(e,t){let n=this.current,i=this.previous,r=n.length,o=i.length,l=0;for(let h=0;h<r;h++){let u=!1,a=n[h];for(;a>i[l];)l++;u=a===i[l],u||Vd(e,a)}l=0;for(let h=0;h<o;h++){let u=!1,a=i[h];for(;a>n[l];)l++;u=n[l]===a,u||Vd(t,a)}}};function Vd(s,e){s.push((e&4294901760)>>16,e&65535)}var qc=(s,e)=>s<e?`${s}-${e}`:`${e}-${s}`,nh=class{constructor(){this.data={keys:[]}}get(e,t){let n=qc(e,t);return this.data[n]}set(e,t,n){let i=qc(e,t);this.get(e,t)||this.data.keys.push(i),this.data[i]=n}delete(e,t){let n=qc(e,t),i=this.data.keys.indexOf(n);i!==-1&&this.data.keys.splice(i,1),delete this.data[n]}reset(){let e=this.data,t=e.keys;for(;t.length>0;){let n=t.pop();delete e[n]}}},rl=class extends Za{constructor(e){e===void 0&&(e={}),super(),this.dt=-1,this.allowSleep=!!e.allowSleep,this.contacts=[],this.frictionEquations=[],this.quatNormalizeSkip=e.quatNormalizeSkip!==void 0?e.quatNormalizeSkip:0,this.quatNormalizeFast=e.quatNormalizeFast!==void 0?e.quatNormalizeFast:!1,this.time=0,this.stepnumber=0,this.default_dt=1/60,this.nextId=0,this.gravity=new S,e.gravity&&this.gravity.copy(e.gravity),e.frictionGravity&&(this.frictionGravity=new S,this.frictionGravity.copy(e.frictionGravity)),this.broadphase=e.broadphase!==void 0?e.broadphase:new $c,this.bodies=[],this.hasActiveBodies=!1,this.solver=e.solver!==void 0?e.solver:new Jc,this.constraints=[],this.narrowphase=new th(this),this.collisionMatrix=new $a,this.collisionMatrixPrevious=new $a,this.bodyOverlapKeeper=new sl,this.shapeOverlapKeeper=new sl,this.contactmaterials=[],this.contactMaterialTable=new nh,this.defaultMaterial=new nl("default"),this.defaultContactMaterial=new tl(this.defaultMaterial,this.defaultMaterial,{friction:.3,restitution:0}),this.doProfiling=!1,this.profile={solve:0,makeContactConstraints:0,broadphase:0,integrate:0,narrowphase:0},this.accumulator=0,this.subsystems=[],this.addBodyEvent={type:"addBody",body:null},this.removeBodyEvent={type:"removeBody",body:null},this.idToBodyMap={},this.broadphase.setWorld(this)}getContactMaterial(e,t){return this.contactMaterialTable.get(e.id,t.id)}collisionMatrixTick(){let e=this.collisionMatrixPrevious;this.collisionMatrixPrevious=this.collisionMatrix,this.collisionMatrix=e,this.collisionMatrix.reset(),this.bodyOverlapKeeper.tick(),this.shapeOverlapKeeper.tick()}addConstraint(e){this.constraints.push(e)}removeConstraint(e){let t=this.constraints.indexOf(e);t!==-1&&this.constraints.splice(t,1)}rayTest(e,t,n){n instanceof _i?this.raycastClosest(e,t,{skipBackfaces:!0},n):this.raycastAll(e,t,{skipBackfaces:!0},n)}raycastAll(e,t,n,i){return n===void 0&&(n={}),n.mode=un.ALL,n.from=e,n.to=t,n.callback=i,Xc.intersectWorld(this,n)}raycastAny(e,t,n,i){return n===void 0&&(n={}),n.mode=un.ANY,n.from=e,n.to=t,n.result=i,Xc.intersectWorld(this,n)}raycastClosest(e,t,n,i){return n===void 0&&(n={}),n.mode=un.CLOSEST,n.from=e,n.to=t,n.result=i,Xc.intersectWorld(this,n)}addBody(e){this.bodies.includes(e)||(e.index=this.bodies.length,this.bodies.push(e),e.world=this,e.initPosition.copy(e.position),e.initVelocity.copy(e.velocity),e.timeLastSleepy=this.time,e instanceof Ge&&(e.initAngularVelocity.copy(e.angularVelocity),e.initQuaternion.copy(e.quaternion)),this.collisionMatrix.setNumObjects(this.bodies.length),this.addBodyEvent.body=e,this.idToBodyMap[e.id]=e,this.dispatchEvent(this.addBodyEvent))}removeBody(e){e.world=null;let t=this.bodies.length-1,n=this.bodies,i=n.indexOf(e);if(i!==-1){n.splice(i,1);for(let r=0;r!==n.length;r++)n[r].index=r;this.collisionMatrix.setNumObjects(t),this.removeBodyEvent.body=e,delete this.idToBodyMap[e.id],this.dispatchEvent(this.removeBodyEvent)}}getBodyById(e){return this.idToBodyMap[e]}getShapeById(e){let t=this.bodies;for(let n=0;n<t.length;n++){let i=t[n].shapes;for(let r=0;r<i.length;r++){let o=i[r];if(o.id===e)return o}}return null}addContactMaterial(e){this.contactmaterials.push(e),this.contactMaterialTable.set(e.materials[0].id,e.materials[1].id,e)}removeContactMaterial(e){let t=this.contactmaterials.indexOf(e);t!==-1&&(this.contactmaterials.splice(t,1),this.contactMaterialTable.delete(e.materials[0].id,e.materials[1].id))}fixedStep(e,t){e===void 0&&(e=1/60),t===void 0&&(t=10);let n=St.now()/1e3;if(!this.lastCallTime)this.step(e,void 0,t);else{let i=n-this.lastCallTime;this.step(e,i,t)}this.lastCallTime=n}step(e,t,n){if(n===void 0&&(n=10),t===void 0)this.internalStep(e),this.time+=e;else{this.accumulator+=t;let i=St.now(),r=0;for(;this.accumulator>=e&&r<n&&(this.internalStep(e),this.accumulator-=e,r++,!(St.now()-i>e*1e3)););this.accumulator=this.accumulator%e;let o=this.accumulator/e;for(let l=0;l!==this.bodies.length;l++){let h=this.bodies[l];h.previousPosition.lerp(h.position,o,h.interpolatedPosition),h.previousQuaternion.slerp(h.quaternion,o,h.interpolatedQuaternion),h.previousQuaternion.normalize()}this.time+=t}}internalStep(e){this.dt=e;let t=this.contacts,n=Sy,i=Ay,r=this.bodies.length,o=this.bodies,l=this.solver,h=this.gravity,u=this.doProfiling,a=this.profile,c=Ge.DYNAMIC,d=-1/0,f=this.constraints,m=My;h.length();let x=h.x,p=h.y,g=h.z,_=0;for(u&&(d=St.now()),_=0;_!==r;_++){let L=o[_];if(L.type===c){let U=L.force,O=L.mass;U.x+=O*x,U.y+=O*p,U.z+=O*g}}for(let L=0,U=this.subsystems.length;L!==U;L++)this.subsystems[L].update();u&&(d=St.now()),n.length=0,i.length=0,this.broadphase.collisionPairs(this,n,i),u&&(a.broadphase=St.now()-d);let y=f.length;for(_=0;_!==y;_++){let L=f[_];if(!L.collideConnected)for(let U=n.length-1;U>=0;U-=1)(L.bodyA===n[U]&&L.bodyB===i[U]||L.bodyB===n[U]&&L.bodyA===i[U])&&(n.splice(U,1),i.splice(U,1))}this.collisionMatrixTick(),u&&(d=St.now());let v=wy,T=t.length;for(_=0;_!==T;_++)v.push(t[_]);t.length=0;let A=this.frictionEquations.length;for(_=0;_!==A;_++)m.push(this.frictionEquations[_]);for(this.frictionEquations.length=0,this.narrowphase.getContacts(n,i,this,t,v,this.frictionEquations,m),u&&(a.narrowphase=St.now()-d),u&&(d=St.now()),_=0;_<this.frictionEquations.length;_++)l.addEquation(this.frictionEquations[_]);let C=t.length;for(let L=0;L!==C;L++){let U=t[L],O=U.bi,D=U.bj,j=U.si,H=U.sj,Z;if(O.material&&D.material?Z=this.getContactMaterial(O.material,D.material)||this.defaultContactMaterial:Z=this.defaultContactMaterial,Z.friction,O.material&&D.material&&(O.material.friction>=0&&D.material.friction>=0&&O.material.friction*D.material.friction,O.material.restitution>=0&&D.material.restitution>=0&&(U.restitution=O.material.restitution*D.material.restitution)),l.addEquation(U),O.allowSleep&&O.type===Ge.DYNAMIC&&O.sleepState===Ge.SLEEPING&&D.sleepState===Ge.AWAKE&&D.type!==Ge.STATIC){let ae=D.velocity.lengthSquared()+D.angularVelocity.lengthSquared(),de=D.sleepSpeedLimit**2;ae>=de*2&&(O.wakeUpAfterNarrowphase=!0)}if(D.allowSleep&&D.type===Ge.DYNAMIC&&D.sleepState===Ge.SLEEPING&&O.sleepState===Ge.AWAKE&&O.type!==Ge.STATIC){let ae=O.velocity.lengthSquared()+O.angularVelocity.lengthSquared(),de=O.sleepSpeedLimit**2;ae>=de*2&&(D.wakeUpAfterNarrowphase=!0)}this.collisionMatrix.set(O,D,!0),this.collisionMatrixPrevious.get(O,D)||(Rr.body=D,Rr.contact=U,O.dispatchEvent(Rr),Rr.body=O,D.dispatchEvent(Rr)),this.bodyOverlapKeeper.set(O.id,D.id),this.shapeOverlapKeeper.set(j.id,H.id)}for(this.emitContactEvents(),u&&(a.makeContactConstraints=St.now()-d,d=St.now()),_=0;_!==r;_++){let L=o[_];L.wakeUpAfterNarrowphase&&(L.wakeUp(),L.wakeUpAfterNarrowphase=!1)}for(y=f.length,_=0;_!==y;_++){let L=f[_];L.update();for(let U=0,O=L.equations.length;U!==O;U++){let D=L.equations[U];l.addEquation(D)}}l.solve(e,this),u&&(a.solve=St.now()-d),l.removeAllEquations();let R=Math.pow;for(_=0;_!==r;_++){let L=o[_];if(L.type&c){let U=R(1-L.linearDamping,e),O=L.velocity;O.scale(U,O);let D=L.angularVelocity;if(D){let j=R(1-L.angularDamping,e);D.scale(j,D)}}}this.dispatchEvent(by),u&&(d=St.now());let b=this.stepnumber%(this.quatNormalizeSkip+1)===0,P=this.quatNormalizeFast;for(_=0;_!==r;_++)o[_].integrate(e,b,P);this.clearForces(),this.broadphase.dirty=!0,u&&(a.integrate=St.now()-d),this.stepnumber+=1,this.dispatchEvent(yy);let B=!0;if(this.allowSleep)for(B=!1,_=0;_!==r;_++){let L=o[_];L.sleepTick(this.time),L.sleepState!==Ge.SLEEPING&&(B=!0)}this.hasActiveBodies=B}emitContactEvents(){let e=this.hasAnyEventListener("beginContact"),t=this.hasAnyEventListener("endContact");if((e||t)&&this.bodyOverlapKeeper.getDiff(jn,Kn),e){for(let r=0,o=jn.length;r<o;r+=2)Ir.bodyA=this.getBodyById(jn[r]),Ir.bodyB=this.getBodyById(jn[r+1]),this.dispatchEvent(Ir);Ir.bodyA=Ir.bodyB=null}if(t){for(let r=0,o=Kn.length;r<o;r+=2)Pr.bodyA=this.getBodyById(Kn[r]),Pr.bodyB=this.getBodyById(Kn[r+1]),this.dispatchEvent(Pr);Pr.bodyA=Pr.bodyB=null}jn.length=Kn.length=0;let n=this.hasAnyEventListener("beginShapeContact"),i=this.hasAnyEventListener("endShapeContact");if((n||i)&&this.shapeOverlapKeeper.getDiff(jn,Kn),n){for(let r=0,o=jn.length;r<o;r+=2){let l=this.getShapeById(jn[r]),h=this.getShapeById(jn[r+1]);Jn.shapeA=l,Jn.shapeB=h,l&&(Jn.bodyA=l.body),h&&(Jn.bodyB=h.body),this.dispatchEvent(Jn)}Jn.bodyA=Jn.bodyB=Jn.shapeA=Jn.shapeB=null}if(i){for(let r=0,o=Kn.length;r<o;r+=2){let l=this.getShapeById(Kn[r]),h=this.getShapeById(Kn[r+1]);Qn.shapeA=l,Qn.shapeB=h,l&&(Qn.bodyA=l.body),h&&(Qn.bodyB=h.body),this.dispatchEvent(Qn)}Qn.bodyA=Qn.bodyB=Qn.shapeA=Qn.shapeB=null}}clearForces(){let e=this.bodies,t=e.length;for(let n=0;n!==t;n++){let i=e[n];i.force,i.torque,i.force.set(0,0,0),i.torque.set(0,0,0)}}};new tn;var Xc=new un,St=globalThis.performance||{};if(!St.now){let s=Date.now();St.timing&&St.timing.navigationStart&&(s=St.timing.navigationStart),St.now=()=>Date.now()-s}new S;var yy={type:"postStep"},by={type:"preStep"},Rr={type:Ge.COLLIDE_EVENT_NAME,body:null,contact:null},wy=[],My=[],Sy=[],Ay=[],jn=[],Kn=[],Ir={type:"beginContact",bodyA:null,bodyB:null},Pr={type:"endContact",bodyA:null,bodyB:null},Jn={type:"beginShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null},Qn={type:"endShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null};var Zd=[{id:"relay",name:{sv:"V\xE4xelhuset",en:"The relay yard"},subtitle:{sv:"V\xE4ck verkstaden.",en:"Wake the workshop."},color:"#aebdad",accent:"#234ce7",edge:"#668d83",ground:"#e9e2d1",number:"01",start:[-10,8],exit:[10,-8],cells:[[-10,-7],[1,8],[10,3]],obstacles:[{x:0,z:0,w:5,d:4,type:"turbine"},{x:-8,z:1,w:3,d:2,type:"crate"},{x:7,z:-4,w:3,d:3,type:"tank"},{x:5,z:7,w:2,d:2,type:"crate"}],enemies:[{type:"chaser",x:-9,z:-5},{type:"chaser",x:8,z:4},{type:"shooter",x:8,z:-8},{type:"chaser",x:1,z:7}],scrap:[[-12,3],[-11,-2],[-7,-9],[-3,-8],[3,-8],[10,-2],[12,6],[7,9],[-4,7],[-4,3]],hazards:[],par:95},{id:"coolant",name:{sv:"Kylverket",en:"The cooling works"},subtitle:{sv:"H\xE5ll huvudet kallt.",en:"Keep your cool."},color:"#a7c4bc",accent:"#ec7853",edge:"#4d807c",ground:"#dde8e1",number:"02",start:[-10,8],exit:[10,-8],cells:[[-10,-8],[10,7],[1,-9]],obstacles:[{x:-4,z:2,w:3,d:6,type:"tank"},{x:5,z:-1,w:3,d:6,type:"tank"},{x:-5,z:-7,w:4,d:2,type:"crate"},{x:3,z:7,w:3,d:2,type:"crate"}],enemies:[{type:"charger",x:-10,z:-4},{type:"shooter",x:10,z:1},{type:"charger",x:7,z:8},{type:"chaser",x:-1,z:-7},{type:"shooter",x:5,z:-8}],scrap:[[-12,2],[-12,-5],[-8,-10],[-1,-6],[1,-2],[1,2],[8,6],[12,9],[12,3],[-7,8],[-6,5]],hazards:[{x:0,z:3,w:3,d:.6,period:4.4,offset:0},{x:8,z:-5,w:6,d:.6,period:4.4,offset:2.2}],par:115},{id:"heart",name:{sv:"Maskinhj\xE4rtat",en:"The machine heart"},subtitle:{sv:"Ett sista ryck.",en:"One last spark."},color:"#d5c693",accent:"#cf6e4d",edge:"#8c946e",ground:"#ece2cd",number:"03",start:[-10,8],exit:[10,-8],cells:[[-10,-7],[10,6],[0,8]],obstacles:[{x:-6,z:0,w:2,d:4,type:"crate"},{x:6,z:0,w:2,d:4,type:"crate"},{x:0,z:3,w:3,d:1.4,type:"crate"}],enemies:[{type:"charger",x:-9,z:-4},{type:"shooter",x:10,z:2},{type:"chaser",x:-1,z:7}],scrap:[[-12,2],[-11,-9],[-7,-9],[7,-9],[12,-3],[12,8],[6,9],[-6,9]],hazards:[],boss:[0,-4],par:155}],oh={halfWidth:14,halfDepth:12};var ol=class{constructor(e){this.world=new rl({gravity:new S(0,0,0),allowSleep:!0}),this.world.broadphase=new Ka(this.world),this.world.solver.iterations=8,this.world.defaultContactMaterial.friction=0,this.world.defaultContactMaterial.restitution=0,this.walls=[];for(let i of e.obstacles)this.box(i.x,i.z,i.w,i.d);let t=oh.halfWidth,n=oh.halfDepth;this.box(-t-.5,0,1,n*2+2),this.box(t+.5,0,1,n*2+2),this.box(0,-n-.5,t*2+2,1),this.box(0,n+.5,t*2+2,1),this.from=new S,this.to=new S,this.rayResult=new _i}box(e,t,n,i){let r=new Ge({mass:0,shape:new Lr(new S(n/2,2,i/2)),position:new S(e,0,t),collisionFilterGroup:4});return this.world.addBody(r),this.walls.push(r),r}actor(e,t,n=.5){let i=new Ge({mass:1,shape:new il(n),position:new S(e,.6,t),fixedRotation:!0,linearDamping:0,collisionFilterGroup:1,collisionFilterMask:4,allowSleep:!1});return i.linearFactor.set(1,0,1),i.angularFactor.set(0,0,0),this.world.addBody(i),i}step(e){this.world.step(1/60,Math.min(Math.max(e,0),.05),3)}remove(e){e.world===this.world&&this.world.removeBody(e)}obstructed(e,t,n,i){return this.from.set(e,.6,t),this.to.set(n,.6,i),this.rayResult.reset(),this.world.raycastClosest(this.from,this.to,{collisionFilterMask:4,skipBackfaces:!0},this.rayResult)}};var Dr=(s,e)=>Math.hypot(s,e),Ut=(s,e)=>Math.hypot(s.x-e.x,s.z-e.z),Ey=(s,e,t)=>Math.min(t,Math.max(e,s)),al=class{constructor(e,t,n){this.view=e,this.sound=t,this.events=n,this.state=pl(),this.load()}newRun(e,t=null){this.state=pl(e,t),this.state.upgrades.includes("shield")&&(this.state.maxHp+=2,this.state.hp=this.state.maxHp),this.load()}load(){this.level=Zd[this.state.sector],this.physics=new ol(this.level),this.view.load(this.level),this.player=this.physics.actor(...this.level.start,.52),this.facing=Math.PI,this.moving=!1,this.dashVector={x:0,z:-1},this.scrap=new Set,this.bullets=[],this.hitDash=new Set,this.elapsed=0,this.enemies=this.level.enemies.map((e,t)=>{let n={...e,body:this.physics.actor(e.x,e.z,e.type==="charger"?.62:.48),hp:e.type==="charger"?5:3,home:{x:e.x,z:e.z},timer:.7+t*.31,telegraph:0,stunned:0,charge:0,dead:!1,seed:t,aim:{x:0,z:0},facing:0};return this.view.addEnemy(n),n}),this.bossState=this.level.boss?{x:this.level.boss[0],z:this.level.boss[1],hp:24,maxHp:24,timer:3,pattern:0,vulnerable:0,waveRadius:0,invulnerable:0,active:!1}:null,this.checkpoint={difficulty:this.state.difficulty,sector:this.state.sector,score:this.state.score,time:this.state.time,upgrades:[...this.state.upgrades]},this.events("loaded",this.checkpoint)}retry(){this.newRun(this.state.difficulty,this.checkpoint)}advance(e){!this.state.ended||this.state.won||(Mh(this.state,e),Sh(this.state),this.load())}hazardActive(e){let t=this.level.hazards[e];return(this.state.sectorTime+t.offset)%t.period>t.period*.67}hit(e=1){yh(this.state,e)&&(this.sound.play("hit"),this.view.shake=.22,this.view.wave(this.player.position.x,this.player.position.z,J.coral,1.8,.3),this.events("hit"),this.state.dead&&(this.player.velocity.set(0,0,0),this.sound.play("fail"),this.events("dead")))}strike(e,t,n=.35){e.dead||(e.hp-=t,e.stunned=n,e.charge=0,e.telegraph=0,this.view.burst(e.body.position.x,e.body.position.z,J.coral,6),this.sound.play("strike"),e.hp<=0&&(e.dead=!0,this.physics.remove(e.body),this.state.kills++,bi(this.state,e.type==="charger"?400:250),this.view.burst(e.body.position.x,e.body.position.z,J.yellow,12),this.events("kill")))}strikeBoss(e){let t=this.bossState;!t||t.hp<=0||t.vulnerable<=0||t.invulnerable>0||(t.hp=Math.max(0,t.hp-e),t.invulnerable=.32,this.sound.play("strike"),this.view.burst(t.x,t.z,J.yellow,10),this.view.shake=.09,t.hp||(this.state.bossDefeated=!0,this.bullets.length=0,t.waveRadius=0,bi(this.state,2e3),this.sound.play("clear"),this.view.wave(t.x,t.z,J.yellow,9,1.1),this.events("boss")))}shoot(e,t,n,i,r=5,o=!1){if(this.bullets.length>=32)return;let l=Dr(n,i)||1;this.bullets.push({x:e,z:t,vx:n/l*r,vz:i/l*r,life:5.5,friendly:o})}discharge(){let e=this.state;if(!vh(e))return;let t=this.player.position,n=e.upgrades.includes("pulse")?4.1:3.4;this.view.wave(t.x,t.z,J.blue,n,.42),this.view.burst(t.x,t.z,J.paper,5),this.sound.play("pulse"),this.events("pulse");for(let i of this.enemies)if(!i.dead&&Ut(t,i.body.position)<n&&!this.physics.obstructed(t.x,t.z,i.body.position.x,i.body.position.z)){this.strike(i,2,.65);let r=i.body.position.x-t.x,o=i.body.position.z-t.z,l=Dr(r,o)||1;i.body.velocity.set(r/l*5,0,o/l*5)}for(let i of this.bullets)!i.friendly&&Ut(t,i)<n&&(i.vx*=-1.7,i.vz*=-1.7,i.friendly=!0,i.life=3);this.bossState&&Ut(t,this.bossState)<n+1.1&&this.strikeBoss(3)}step(e,t){let n=this.state;if(n.dead||n.won||n.ended)return;e=Ey(e,0,.05),xh(n,e),this.elapsed+=e;let i=t.x||0,r=t.y||0,o=Dr(i,r);o>1&&(i/=o,r/=o,o=1);let l=(i+r)*Math.SQRT1_2,h=(r-i)*Math.SQRT1_2;if(o>.1&&(this.facing=Math.atan2(l,h)),t.dash&&_h(n)){o<.1&&(l=Math.sin(this.facing),h=Math.cos(this.facing));let c=Dr(l,h)||1;this.dashVector={x:l/c,z:h/c},this.hitDash.clear(),this.sound.play("dash"),this.view.wave(this.player.position.x,this.player.position.z,J.paper,1.1,.22),this.events("dash")}t.pulse&&this.discharge();let u=n.dashing>0?24:6.5;this.player.velocity.set((n.dashing>0?this.dashVector.x:l)*u,0,(n.dashing>0?this.dashVector.z:h)*u),this.moving=o>.1||n.dashing>0;let a=this.player.position;for(let c of this.enemies)this.stepEnemy(c,a,e);this.physics.step(e);for(let c of this.enemies){if(c.dead)continue;let d=Ut(a,c.body.position);n.dashing>0&&d<1.65&&!this.hitDash.has(c)?(this.hitDash.add(c),this.strike(c,3)):d<.98&&c.stunned<=0&&this.hit()}for(let c=0;c<this.level.cells.length;c++){let[d,f]=this.level.cells[c];Ut(a,{x:d,z:f})<1.1&&bh(n,`cell-${c}`)&&(this.sound.play("cell"),this.view.burst(d,f,J.yellow,18),this.view.wave(d,f,J.blue,2.2),this.events("cell"))}for(let c=0;c<this.level.scrap.length;c++){if(this.scrap.has(c))continue;let[d,f]=this.level.scrap[c];Ut(a,{x:d,z:f})<.9&&(this.scrap.add(c),n.scrap++,bi(n,65),this.sound.play("scrap"))}for(let c=0;c<this.level.hazards.length;c++){let d=this.level.hazards[c];this.hazardActive(c)&&Math.abs(a.x-d.x)<d.w/2+.25&&Math.abs(a.z-d.z)<d.d/2+.3&&this.hit()}this.stepBoss(e),this.stepBullets(e),Ut(a,{x:this.level.exit[0],z:this.level.exit[1]})<1.25&&wh(n)&&(this.sound.play("clear"),this.events(n.won?"won":"sector"))}stepEnemy(e,t,n){if(e.dead)return;if(e.stunned=Math.max(0,e.stunned-n),e.stunned>0){e.body.velocity.scale(Math.exp(-n*8),e.body.velocity);return}let i=e.body.position,r=t.x-i.x,o=t.z-i.z,l=Dr(r,o)||1;e.facing=Math.atan2(r,o),e.timer-=n;let h=!this.physics.obstructed(i.x,i.z,t.x,t.z),u=this.state.difficulty==="assist"?.85:1;if(e.type==="shooter"){if(e.body.velocity.set(0,0,0),l>13||!h){e.telegraph=0,e.timer=Math.max(.6,e.timer);return}e.timer<.8&&e.telegraph<=0&&(e.telegraph=.8,e.timer=.8,e.aim={x:r/l,z:o/l}),e.telegraph>0&&(e.telegraph=Math.max(.001,e.telegraph-n)),e.timer<=0&&(this.shoot(i.x,i.z,e.aim.x,e.aim.z,5.6*u),this.sound.play("shot"),e.timer=2.6,e.telegraph=0)}else if(e.type==="charger"){if(e.charge>0){e.charge-=n,e.body.velocity.set(e.aim.x*11*u,0,e.aim.z*11*u);return}l<10&&h&&e.timer<=.85?(e.telegraph<=0&&(e.telegraph=.85,e.timer=.85,e.aim={x:r/l,z:o/l}),e.body.velocity.set(0,0,0),e.telegraph=Math.max(.001,e.telegraph-n),e.timer<=0&&(e.charge=.55,e.telegraph=0,e.timer=3.3,this.sound.play("shot"))):(e.telegraph=0,l>1.5?this.seek(e,r/l,o/l,2*u,h):e.body.velocity.set(0,0,0))}else l<12?this.seek(e,r/l,o/l,2.5*u,h):e.body.velocity.set(0,0,0)}seek(e,t,n,i,r){if(!r){let o=e.body.position,l=e.seed%2?1:-1,h=[[t,n],[-n*l,t*l],[n*l,-t*l]];for(let[u,a]of h)if(!this.physics.obstructed(o.x,o.z,o.x+u*1.7,o.z+a*1.7)){t=u,n=a;break}}e.body.velocity.set(t*i,0,n*i)}stepBoss(e){let t=this.bossState,n=this.state;if(!t||n.bossDefeated)return;let i=this.player.position;if(t.active=n.cells.size>=2||Ut(i,t)<7,!!t.active&&(t.invulnerable=Math.max(0,t.invulnerable-e),t.vulnerable=Math.max(0,t.vulnerable-e),t.timer-=e,t.waveRadius>0&&(t.waveRadius+=e*4.7,Math.abs(Ut(i,t)-t.waveRadius)<.55&&this.hit(),t.waveRadius>21&&(t.waveRadius=0)),n.dashing>0&&Ut(i,t)<2.3&&this.strikeBoss(3),Ut(i,t)<1.6&&t.vulnerable<=0&&this.hit(),t.timer<=0)){let r=n.difficulty==="assist"?.8:1;if(t.pattern%3===0)for(let o=0;o<12;o++){let l=o*Math.PI/6;this.shoot(t.x,t.z,Math.sin(l),Math.cos(l),4.4*r)}else if(t.pattern%3===1)t.waveRadius=1;else{let o=Math.atan2(i.z-t.z,i.x-t.x);for(let l=-2;l<=2;l++)this.shoot(t.x,t.z,Math.cos(o+l*.18),Math.sin(o+l*.18),6.4*r)}t.pattern++,t.timer=t.hp<=12?4.4:5.1,t.vulnerable=3.1,this.sound.play("boss"),this.view.wave(t.x,t.z,J.coral,2,.6)}}stepBullets(e){let t=this.player.position;for(let n=this.bullets.length-1;n>=0;n--){let i=this.bullets[n],r=i.x+i.vx*e,o=i.z+i.vz*e;if(i.life-=e,i.life<=0||this.physics.obstructed(i.x,i.z,r,o)){this.bullets.splice(n,1);continue}if(i.x=r,i.z=o,i.friendly){let l=!1;for(let h of this.enemies)if(!h.dead&&Ut(i,h.body.position)<.75){this.strike(h,3),l=!0;break}this.bossState&&Ut(i,this.bossState)<1.7&&!this.state.bossDefeated&&(this.strikeBoss(2),l=!0),l&&this.bullets.splice(n,1)}else Ut(i,t)<.7&&(this.state.dashing>0?(i.vx*=-1.6,i.vz*=-1.6,i.friendly=!0,bi(this.state,40)):(this.hit(),this.bullets.splice(n,1)))}}objective(){let e=this.player.position,t=this.level.cells.map(([n,i],r)=>({x:n,z:i,id:r,kind:"cell"})).filter(n=>!this.state.cells.has(`cell-${n.id}`));return t.length?t.sort((n,i)=>Ut(n,e)-Ut(i,e))[0]:this.bossState&&!this.state.bossDefeated?{...this.bossState,kind:"boss"}:{x:this.level.exit[0],z:this.level.exit[1],kind:"exit"}}snapshot(){let e=this.state,t=this.player.position;return{sector:e.sector,hp:e.hp,maxHp:e.maxHp,cells:[...e.cells],score:e.score,time:e.time,dead:e.dead,won:e.won,player:{x:t.x,z:t.z},dashCooldown:e.dashCooldown,pulseCooldown:e.pulseCooldown,enemies:this.enemies.map(n=>({x:n.body.position.x,z:n.body.position.z,hp:n.hp,dead:n.dead,type:n.type})),boss:this.bossState?{hp:this.bossState.hp,vulnerable:this.bossState.vulnerable,wave:this.bossState.waveRadius}:null,bullets:this.bullets.length,bodies:this.physics.world.bodies.length,objective:this.objective()}}};var ll=class{constructor(e,t){this.enabled=!1,this.keys=new Set,this.stick={x:0,y:0,id:null},this.held={dash:!1,pulse:!1},this.taps={dash:!1,pulse:!1},this.canvas=e,window.addEventListener("keydown",u=>{if(u.code==="Escape"&&this.enabled){u.preventDefault(),t();return}!this.enabled||u.target.closest?.("input,select,button")||["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","ShiftLeft","ShiftRight","KeyW","KeyA","KeyS","KeyD","KeyJ","KeyK","KeyE"].includes(u.code)&&(u.preventDefault(),this.keys.add(u.code),!u.repeat&&["Space","ShiftLeft","ShiftRight"].includes(u.code)&&(this.taps.dash=!0),!u.repeat&&["KeyJ","KeyK","KeyE"].includes(u.code)&&(this.taps.pulse=!0))}),window.addEventListener("keyup",u=>this.keys.delete(u.code)),window.addEventListener("blur",()=>this.clear()),e.addEventListener("contextmenu",u=>u.preventDefault());let n=u=>{if(!(!this.enabled||u.pointerType!=="mouse"))for(let[a,c]of[["pulse",1],["dash",2]]){let d=!!(u.buttons&c);d&&!this.held[a]&&(this.taps[a]=!0),this.held[a]=d}};e.addEventListener("pointerdown",u=>{!this.enabled||u.pointerType!=="mouse"||(u.preventDefault(),e.setPointerCapture(u.pointerId),n(u))}),e.addEventListener("pointermove",n);let i=()=>{this.held.dash=!1,this.held.pulse=!1};e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("lostpointercapture",i);for(let u of["dash","pulse"]){let a=document.getElementById(`${u}-control`);a.addEventListener("pointerdown",d=>{this.enabled&&(d.preventDefault(),a.setPointerCapture(d.pointerId),this.held[u]=!0,this.taps[u]=!0)});let c=()=>{this.held[u]=!1};for(let d of["pointerup","pointercancel","lostpointercapture"])a.addEventListener(d,c);a.addEventListener("click",d=>{d.detail===0&&this.enabled&&(this.taps[u]=!0)})}let r=document.getElementById("joystick"),o=r.querySelector("i");this.nub=o;let l=u=>{if(this.stick.id!==u.pointerId)return;let a=r.getBoundingClientRect(),c=u.clientX-a.left-a.width/2,d=u.clientY-a.top-a.height/2,f=Math.hypot(c,d),m=42;this.stick.x=c/Math.max(m,f),this.stick.y=d/Math.max(m,f),o.style.transform=`translate(${this.stick.x*m}px,${this.stick.y*m}px)`};r.addEventListener("pointerdown",u=>{!this.enabled||this.stick.id!==null||(u.preventDefault(),this.stick.id=u.pointerId,r.setPointerCapture(u.pointerId),l(u))}),r.addEventListener("pointermove",l);let h=u=>{this.stick.id===u.pointerId&&(this.stick={x:0,y:0,id:null},o.style.transform="")};for(let u of["pointerup","pointercancel","lostpointercapture"])r.addEventListener(u,h)}clear(){this.keys.clear(),this.stick={x:0,y:0,id:null},this.held={dash:!1,pulse:!1},this.taps={dash:!1,pulse:!1},this.nub&&(this.nub.style.transform="")}read(){if(!this.enabled)return{x:0,y:0,dash:!1,pulse:!1};let e=this.keys,t={x:Number(e.has("KeyD")||e.has("ArrowRight"))-Number(e.has("KeyA")||e.has("ArrowLeft"))+this.stick.x,y:Number(e.has("KeyS")||e.has("ArrowDown"))-Number(e.has("KeyW")||e.has("ArrowUp"))+this.stick.y,dash:e.has("Space")||e.has("ShiftLeft")||e.has("ShiftRight")||this.held.dash||this.taps.dash,pulse:e.has("KeyJ")||e.has("KeyK")||e.has("KeyE")||this.held.pulse||this.taps.pulse};return this.taps.dash=!1,this.taps.pulse=!1,t}};var Is=gf(jd(),1),hl=class{constructor(e){this.settings=e,this.ready=!1,this.fx={},this.active=!1}ensure(){if(this.ready){Is.Howler.ctx?.resume().catch(()=>{});return}this.ready=!0;let e=new URL("/play/skift/audio/",document.baseURI).href;for(let t of["dash","pulse","hit","strike","scrap","cell","shot","clear","fail","boss"])this.fx[t]=new Is.Howl({src:[`${e}${t}.wav`],volume:t==="shot"?.13:.3,preload:!0});this.music=new Is.Howl({src:[`${e}shift.mp3`],loop:!0,volume:.17,preload:!0}),this.apply()}apply(){this.ready&&(Is.Howler.mute(!this.settings.sound),this.active&&this.settings.sound&&this.settings.music?this.music.playing()||this.music.play():this.music.pause())}play(e){if(!this.ready||!this.settings.sound)return;let t=this.fx[e];t&&(!t.playing()||e==="dash")&&t.play()}start(){this.ensure(),this.active=!0,this.apply()}pause(){this.active=!1,this.ready&&(this.music.pause(),Object.values(this.fx).forEach(e=>e.stop()))}};var Kd={sv:{workshop:"ETT SPEL FR\xC5N VERKSTADEN",portfolio:"Till portfolion",how:"S\xE5 spelar du",settings:"Inst\xE4llningar",line1:"Sista skiftet.",line2:"Full fart.",intro:"En liten robot. En stor kortslutning. V\xE4xla upp, sl\xE5 tillbaka och f\xE5 verkstaden att leva igen.",start:"Starta skiftet",resumeRun:"Forts\xE4tt skiftet",newRun:"B\xF6rja fr\xE5n b\xF6rjan",subtitle:"ETT MEKANISKT ACTION\xC4VENTYR",noInstall:"Tre distrikt. Ett maskinhj\xE4rta. Bara du.",saving:"Framsteg sparas p\xE5 den h\xE4r enheten.",loading:"Bygger upp verkstaden",ready:"VERKSTADEN \xC4R \xD6PPEN",sector:"DISTRIKT",cells:"ENERGICELLER",score:"PO\xC4NG",hull:"SKROV",collect:"Samla tre energiceller.",exit:"Porten \xE4r \xF6ppen. Ta dig ut!",bossGoal:"Kyl regulatorn. Sl\xE5 n\xE4r k\xE4rnan \xE4r gul.",dash:"DASH",pulse:"PULS",pause:"Pausa",move:"R\xD6R DIG",back:"Tillbaka",close:"St\xE4ng",continue:"Forts\xE4tt",paused:"Ta en andningspaus.",pausedText:"Verkstaden v\xE4ntar. Inget r\xF6r sig f\xF6rr\xE4n du \xE4r tillbaka.",resume:"Tillbaka till skiftet",toMenu:"Till startsk\xE4rmen",howTitle:"Liten robot. Stora m\xF6jligheter.",howText:"\xC5terst\xE4ll str\xF6mmen i tre distrikt. Samla de bl\xE5 energicellerna och n\xE5 den m\xE4rkta porten.",moveText:"WASD eller piltangenter. P\xE5 touchsk\xE4rm: styrspaken till v\xE4nster.",dashText:"Mellanslag / Shift eller h\xF6gerklick. Rusa genom fiender och projektiler. Under dashen \xE4r du os\xE5rbar.",pulseText:"J / E eller v\xE4nsterklick. Knuffa tillbaka fiender och skicka deras skott i retur. H\xE5ll inne f\xF6r att anv\xE4nda igen n\xE4r pulsen laddats.",readText:"Orange markeringar varnar f\xF6r attacker. Gula k\xE4rnor \xE4r s\xE5rbara. Energiceller reparerar ett skrovsteg.",scoreText:"Kedja skrot och besegrade vakter f\xF6r h\xF6gre po\xE4ng. Snabba, oskadda distrikt ger bonus. En uppgradering v\xE4ntar mellan distrikten.",bossText:"Regulatorn \xF6ppnar sin gula k\xE4rna efter varje attack. Sl\xE5 med dash eller puls. Dasha genom de ut\xE5tg\xE5ende chockv\xE5gorna.",sound:"Ljud",music:"Musik",motion:"Extra r\xF6relser och effekter",language:"Spr\xE5k",quality:"Bildfrekvens",eco:"30 FPS \xB7 energisn\xE5l",smooth:"60 FPS \xB7 h\xF6gre effektbehov",difficulty:"Sv\xE5righetsgrad",normal:"Standard",assist:"Assist \xB7 mer skrov, l\xE5ngsammare fiender",difficultyNote:"Sv\xE5righetsgraden g\xE4ller n\xE4sta nya skift.",storageNote:"Endast lokala framsteg och inst\xE4llningar. Inga konton, ingen sp\xE5rning.",sectorDone:"Ett distrikt vaknar.",upgradePrompt:"Ta en uppgradering till n\xE4sta skift.",choose:"V\xC4LJ UPPGRADERING",dashName:"Snabbv\xE4xel",dashDesc:"Kortare v\xE4ntan mellan dashar. H\xE5ll dig i r\xF6relse.",pulseName:"St\xF6rre urladdning",pulseDesc:"St\xF6rre pulsradie och snabbare \xE5terladdning.",shieldName:"Reservpl\xE5t",shieldDesc:"Tv\xE5 extra skrovsteg. Hela skrovet repareras.",dead:"Ett litet driftstopp.",deadText:"Du b\xF6rjar om i samma distrikt. Dina tidigare distriktsframsteg \xE4r kvar.",retry:"F\xF6rs\xF6k igen",won:"Verkstaden lever.",wonText:"Tre distrikt. Ett \xE5terst\xE4llt maskinhj\xE4rta. Du kan ta rast nu. Eller ett skift till.",again:"Ett skift till",total:"SLUTPO\xC4NG",best:"DITT B\xC4STA",time:"TID",rank:"OMD\xD6ME",newBest:"NYTT PERSONB\xC4STA",cellFound:"Energicell \xE5terfunnen. Ett skrovsteg reparerat.",kill:"Vakt urkopplad.",bossDown:"Regulatorn \xE4r avst\xE4ngd. Porten \xE4r \xF6ppen.",startupError:"Ett ov\xE4ntat fel uppstod n\xE4r spelet laddades. Ladda om sidan. Dina sparade framsteg finns kvar.",tutorialTouchMove:"Styr med spaken till v\xE4nster. F\xF6lj den bl\xE5 mark\xF6ren till energicellerna.",tutorialTouchDash:"Tryck DASH f\xF6r att rusa genom faran. PULS sl\xE5r tillbaka och reflekterar skott.",tutorialMove:"R\xF6r dig med WASD eller pilarna. F\xF6lj den bl\xE5 mark\xF6ren till energicellerna.",tutorialDash:"Mellanslag: dasha genom faran. J: sl\xE5 tillbaka med en puls.",tutorialCell:"En energicell reparerar ett skrovsteg. Samla alla tre och g\xE5 till porten.",fault:"Verkstaden kunde inte starta.",faultText:"Spelet beh\xF6ver WebGL 2 i en vanlig, uppdaterad webbl\xE4sare. Kontrollera att h\xE5rdvaruacceleration \xE4r tillg\xE4nglig och ladda om.",reload:"Ladda om",contextLost:"Grafiken pausades av webbl\xE4saren. Ladda om f\xF6r att \xE5terg\xE5 till senaste distriktscheckpoint.",noStorage:"Webbl\xE4saren till\xE5ter inte sparning. Du kan spela, men framstegen f\xF6rsvinner n\xE4r sidan st\xE4ngs.",touch:"TOUCH",checkpoint:"Checkpoint: distrikt",counter:"AV 3",available:"Redo",footer:"TEKNIK MED HJ\xC4RNA. LITE BUS I SYSTEMET."},en:{workshop:"A GAME FROM THE WORKSHOP",portfolio:"Back to portfolio",how:"How to play",settings:"Settings",line1:"Last shift.",line2:"Full tilt.",intro:"One small robot. One enormous short circuit. Shift up, strike back and bring the workshop to life.",start:"Start your shift",resumeRun:"Continue your shift",newRun:"Start from the beginning",subtitle:"A MECHANICAL ACTION ADVENTURE",noInstall:"Three districts. One machine heart. Just you.",saving:"Progress stays on this device.",loading:"Waking up the workshop",ready:"THE WORKSHOP IS OPEN",sector:"DISTRICT",cells:"ENERGY CELLS",score:"SCORE",hull:"HULL",collect:"Recover three energy cells.",exit:"The gate is open. Get to it!",bossGoal:"Cool the regulator. Strike the yellow core.",dash:"DASH",pulse:"PULSE",pause:"Pause",move:"MOVE",back:"Back",close:"Close",continue:"Continue",paused:"Take a breath.",pausedText:"The workshop can wait. Nothing moves until you are ready.",resume:"Back to your shift",toMenu:"Back to the title",howTitle:"Small robot. Big possibilities.",howText:"Restore power in three districts. Collect the blue energy cells and reach the marked gate.",moveText:"WASD or arrow keys. On a touchscreen, use the stick on the left.",dashText:"Space / Shift or right-click. Rush through enemies and shots. You are invulnerable during a dash.",pulseText:"J / E or left-click. Knock back enemies and return their shots. Hold to use again when the pulse recharges.",readText:"Orange marks warn of attacks. Yellow cores are vulnerable. Every energy cell repairs one hull segment.",scoreText:"Chain scrap and defeated sentries for a higher score. Fast, undamaged districts earn bonuses. Choose an upgrade between districts.",bossText:"The regulator exposes its yellow core after each attack. Hit it with a dash or pulse. Dash through outward-moving shockwaves.",sound:"Sound",music:"Music",motion:"Extra motion and effects",language:"Language",quality:"Frame rate",eco:"30 FPS \xB7 energy saving",smooth:"60 FPS \xB7 higher power demand",difficulty:"Difficulty",normal:"Standard",assist:"Assist \xB7 more hull, slower enemies",difficultyNote:"Difficulty applies to the next new shift.",storageNote:"Only local progress and preferences. No account. No tracking.",sectorDone:"A district wakes up.",upgradePrompt:"Take one upgrade into your next shift.",choose:"CHOOSE AN UPGRADE",dashName:"Quickshift",dashDesc:"Less time between dashes. Keep moving.",pulseName:"Overcharge",pulseDesc:"A wider pulse with a shorter recharge.",shieldName:"Spare plating",shieldDesc:"Two extra hull segments. Fully repaired.",dead:"A minor breakdown.",deadText:"Restart this district. Your previous district progress is safe.",retry:"Try again",won:"The workshop lives.",wonText:"Three districts. One restored machine heart. Take a break. Or take another shift.",again:"One more shift",total:"FINAL SCORE",best:"PERSONAL BEST",time:"TIME",rank:"RANK",newBest:"NEW PERSONAL BEST",cellFound:"Energy cell recovered. One hull segment repaired.",kill:"Sentry disconnected.",bossDown:"Regulator shut down. The gate is open.",startupError:"An unexpected error occurred while loading the game. Reload the page. Your saved progress is kept.",tutorialTouchMove:"Move with the left stick. Follow the blue marker to the energy cells.",tutorialTouchDash:"Tap DASH to rush through danger. PULSE strikes back and reflects shots.",tutorialMove:"Move with WASD or the arrows. Follow the blue marker to the energy cells.",tutorialDash:"Space: dash through danger. J: strike back with a pulse.",tutorialCell:"Energy cells repair one hull segment. Collect all three, then find the gate.",fault:"The workshop could not start.",faultText:"This game needs WebGL 2 in an up-to-date browser. Check that hardware acceleration is available and reload.",reload:"Reload",contextLost:"The browser paused graphics. Reload to return to your last district checkpoint.",noStorage:"This browser is blocking local saves. You can play, but progress will be lost when this page closes.",touch:"TOUCH",checkpoint:"Checkpoint: district",counter:"OF 3",available:"Ready",footer:"ENGINEERED WITH CARE. A LITTLE MISCHIEF INCLUDED."}};var ul=class{constructor(e,t,n,i){this.touchQuery=matchMedia("(pointer:coarse)"),this.settings=e,this.save=t,this.onAction=n,this.onSetting=i,this.modal=document.getElementById("modal"),this.kind=null,this.game=null,this.didDash=!1,this.didPulse=!1,this.nodes=Object.fromEntries(["title-screen","game-screen","start-button","new-button","sector-number","sector-title","objective-text","cell-count","cell-icons","health","score","clock","dash-control","pulse-control","dash-ready","pulse-ready","waypoint","waypoint-label","combo","combo-number","tutorial","boss-hud","boss-health","boss-state"].map(r=>[r,document.getElementById(r)])),document.addEventListener("click",r=>{let o=r.target.closest("[data-action]");o&&!o.disabled&&n(o.dataset.action,o.dataset.value)}),this.modal.addEventListener("change",r=>{let o=r.target.dataset.setting;o&&i(o,r.target.type==="checkbox"?r.target.checked:r.target.value)}),this.modal.addEventListener("cancel",r=>{r.preventDefault(),n("close")}),this.translate()}t(e){return (["workshop","line1","line2","intro","start","resumeRun","newRun","noInstall","saving","loading","ready","footer"].includes(e)?globalThis.__OY_SKIFT_COPY__?.["runtime.skift."+this.settings.language+"."+e]:undefined)??(Kd[this.settings.language][e]||e)}translate(){document.documentElement.lang=this.settings.language,document.querySelectorAll("[data-t]").forEach(n=>n.textContent=this.t(n.dataset.t)),document.getElementById("language-button").textContent=this.settings.language==="sv"?"SV / EN":"EN / SV",document.getElementById("pause-button").setAttribute("aria-label",this.t("pause"));let e=this.settings.language==="sv",t=e?"Spelv\xE4rld":"Game world";document.getElementById("world").setAttribute("aria-label",t),document.querySelector("#world canvas")?.setAttribute("aria-label","SKIFT \u2014 "+t),document.querySelector("[data-skift-menu]").setAttribute("aria-label",e?"Spelmeny":"Game menu"),document.getElementById("joystick").setAttribute("aria-label",e?"Styrspak":"Movement joystick"),this.nodes["pulse-control"].setAttribute("aria-label",e?"Puls":"Pulse"),document.getElementById("language-button").setAttribute("aria-label",e?"Byt till engelska":"Switch to Swedish"),this.nodes.health.setAttribute("aria-label",this.t("hull")),this.updateTitle(),this.isReady&&(document.getElementById("load-status").textContent=this.t("ready"))}updateTitle(){let e=!!this.save.checkpoint;this.nodes["start-button"].querySelector("[data-t]").textContent=this.t(e?"resumeRun":"start"),this.nodes["new-button"].hidden=!e}ready(){this.isReady=!0,this.nodes["start-button"].disabled=!1,document.getElementById("load-status").textContent=this.t("ready"),this.translate()}mode(e){let t=e==="menu";this.nodes["title-screen"].hidden=!t,this.nodes["game-screen"].hidden=t,document.body.dataset.mode=e}announce(e){document.getElementById("announcer").textContent=e}toast(e){let t=document.getElementById("toast");t.textContent=e,t.hidden=!1,clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{t.hidden=!0},5e3)}close(){this.modal.open&&this.modal.close(),this.kind=null}open(e,t=this.game,n=""){this.kind=e,this.game=t;let i=d=>this.t(d),r=t?.state,o="",l="",h="",u="",a="SKIFT / POWER WORKS",c=["how","settings","pause"].includes(e);if(e==="pause"&&(o=i("paused"),l=i("pausedText"),u=`<button class="primary" data-action="resume">${i("resume")} \u2197</button><button class="secondary" data-action="settings">${i("settings")}</button><button class="text-button" data-action="menu">${i("toMenu")}</button>`),e==="how"&&(o=i("howTitle"),l=i("howText"),h=[["WASD","moveText"],["\u2197","dashText"],["\u25CE","pulseText"],["!","readText"],["\xD7","scoreText"],["03","bossText"]].map(([d,f])=>`<div class="how-row"><b>${d}</b><p>${i(f)}</p></div>`).join(""),u=`<button class="primary" data-action="close">${i("back")} \u2197</button>`),e==="settings"){o=i("settings");let d=(m,x,p)=>`<label class="setting-row"><span>${i(x)}</span><select data-setting="${m}">${p.map(([g,_])=>`<option value="${g}" ${this.settings[m]===g?"selected":""}>${_}</option>`).join("")}</select></label>`,f=(m,x)=>`<label class="setting-row"><span>${i(x)}</span><input type="checkbox" data-setting="${m}" ${this.settings[m]?"checked":""}></label>`;h=d("language","language",[["sv","Svenska"],["en","English"]])+d("quality","quality",[["eco",i("eco")],["smooth",i("smooth")]])+f("sound","sound")+f("music","music")+f("motion","motion")+d("difficulty","difficulty",[["normal",i("normal")],["assist",i("assist")]])+`<p class="setting-note">${i("difficultyNote")}</p><p class="setting-note">${i("storageNote")}</p>`,u=`<button class="primary" data-action="close">${i("back")} \u2197</button>`}e==="sector"&&(o=i("sectorDone"),l=i("upgradePrompt"),a=`${i("sector")} ${String(r.sector+1).padStart(2,"0")} / ${i("choose")}`,h=`<div class="upgrade-grid">${["dash","pulse","shield"].filter(d=>!r.upgrades.includes(d)).map(d=>`<button class="upgrade" data-action="upgrade" data-value="${d}"><span class="upgrade-icon">${d==="dash"?"\u2197":d==="pulse"?"\u25CE":"\u25A4"}</span><span><h3>${i(d+"Name")}</h3><p>${i(d+"Desc")}</p></span><span class="upgrade-arrow">\u2192</span></button>`).join("")}</div>`),e==="dead"&&(o=i("dead"),l=i("deadText"),h=`<div class="result-stats"><div><span>${i("sector")}</span><strong>0${r.sector+1}</strong></div><div><span>${i("score")}</span><strong>${r.score.toLocaleString(this.settings.language)}</strong></div></div>`,u=`<button class="primary" data-action="retry">${i("retry")} \u2197</button><button class="secondary" data-action="menu">${i("toMenu")}</button>`),e==="won"&&(o=i("won"),l=i("wonText"),a=`SKIFT / ${i("rank")} ${kr(r.score)}`,h=`<div class="rank-stamp" aria-label="${i("rank")} ${kr(r.score)}">${kr(r.score)}</div><div class="result-stats"><div><span>${i("total")}</span><strong>${r.score.toLocaleString(this.settings.language)}</strong></div><div><span>${i("time")}</span><strong>${xl(r.time)}</strong></div><div><span>${i("best")}</span><strong>${this.save.best.toLocaleString(this.settings.language)}</strong></div><div><span>${i("difficulty")}</span><strong>${r.difficulty==="assist"?"Assist":i("normal")}</strong></div></div>${r.score>=this.save.best?`<span class="new-best">${i("newBest")}</span>`:""}`,u=`<button class="primary" data-action="new">${i("again")} \u2197</button><button class="secondary" data-action="menu">${i("toMenu")}</button>`),e==="error"&&(o=i("fault"),l=n||i("faultText"),u=`<button class="primary" data-action="reload">${i("reload")} \u2197</button>`),this.modal.innerHTML=`<div class="modal-inner">${c?`<button class="modal-close" data-action="close" aria-label="${i("close")}">\xD7</button>`:""}<p class="eyebrow">${a}</p><h2 id="modal-title">${o}</h2>${l?`<p>${l}</p>`:""}${h}${u?`<div class="modal-actions">${u}</div>`:""}</div>`,this.modal.open||this.modal.showModal(),(this.modal.querySelector(".primary,.upgrade")||this.modal.querySelector("select,button"))?.focus({preventScroll:!0})}hud(e,t){this.game=e;let n=e.state,i=this.nodes;i["sector-number"].textContent=`0${n.sector+1} / 03`,i["sector-title"].textContent=e.level.name[this.settings.language],i["objective-text"].textContent=this.t(n.cells.size<3?"collect":e.bossState&&!n.bossDefeated?"bossGoal":"exit"),i["cell-count"].textContent=`${n.cells.size} / 3`,[...i["cell-icons"].children].forEach((l,h)=>l.classList.toggle("on",n.cells.has(`cell-${h}`))),[...i.health.children].forEach((l,h)=>{l.hidden=h>=n.maxHp,l.classList.toggle("empty",h>=n.hp)}),i.health.setAttribute("aria-valuenow",String(n.hp)),i.health.setAttribute("aria-valuemax",String(n.maxHp)),i.score.textContent=String(n.score).padStart(5,"0"),i.clock.textContent=xl(n.time);for(let[l,h,u]of[["dash",n.dashCooldown,ml(n)],["pulse",n.pulseCooldown,gl(n)]])i[`${l}-control`].style.setProperty("--cooldown",`${Math.min(100,h/u*100)}%`),i[`${l}-ready`].textContent=h>0?`${h.toFixed(1)}s`:this.t("available");i.combo.hidden=n.combo<2,i["combo-number"].textContent=`\xD7${(1+(n.combo-1)*.2).toFixed(1)}`;let r=e.objective(),o=t.project(r.x,r.z,1.4);i.waypoint.style.left=`${Math.max(25,Math.min(t.width-25,o.x))}px`,i.waypoint.style.top=`${Math.max(170,Math.min(t.height-145,o.y))}px`,i["waypoint-label"].textContent=r.kind==="cell"?`${r.id+1}`:r.kind==="boss"?"!":"\u2192",i["boss-hud"].hidden=!e.bossState?.active||n.bossDefeated,e.bossState&&(i["boss-health"].style.width=`${e.bossState.hp/e.bossState.maxHp*100}%`,i["boss-state"].textContent=e.bossState.vulnerable>0?this.settings.language==="sv"?"K\xC4RNAN \xC4R \xD6PPEN":"CORE EXPOSED":""),i.tutorial.textContent=n.sector===0&&n.sectorTime<32?this.t(n.cells.size>0?"tutorialCell":n.sectorTime>10?this.touchQuery.matches?"tutorialTouchDash":"tutorialDash":this.touchQuery.matches?"tutorialTouchMove":"tutorialMove"):""}};var Br;try{Br=window.localStorage}catch{Br=null}var Zt=Ah(Br),nn=Zt.settings;Br||Object.assign(Zt,Xi(null));matchMedia("(prefers-reduced-motion: reduce)").matches&&(nn.motion=!1);var yt="menu",Rt,zt,An,Sn,Ur=!1,Ls=0,Ns=0,ef=performance.now(),ah=0,Jd="menu",Xe,dn={frames:0,steps:0,cost:[],maxCost:0},Ds=()=>{let s=Th(Br,Zt);return!s&&Ur&&!Ds.warned&&(Ds.warned=!0,Xe.toast(Xe.t("noStorage"))),s};Xe=new ul(nn,Zt,Ry,tf);function Fn(){!Ls&&!document.hidden&&(Ls=requestAnimationFrame(Cy))}function Cy(s){if(Ls=0,!Ur||document.hidden)return;let e=1e3/(nn.quality==="smooth"?60:30);if(s-Ns<e-.7){Fn();return}let t=Math.min(.05,Math.max(0,(s-Ns)/1e3));Ns=s;let n=performance.now();yt==="play"&&(Rt.step(t,An.read()),dn.steps++),zt.draw(Rt,yt,yt==="play"||yt==="menu"?t:0,s/1e3),yt!=="menu"&&s-ah>90&&(Xe.hud(Rt,zt),ah=s);let i=performance.now()-n;dn.frames++,dn.maxCost=Math.max(dn.maxCost,i),dn.cost.push(i),dn.cost.length>600&&dn.cost.shift(),(yt==="play"||yt==="menu"&&s-ef<1e4)&&Fn()}function Fr(){yt="play",An.enabled=!0,An.clear(),Xe.close(),Xe.mode(yt),Sn.start(),Ns=performance.now(),ah=0,zt.renderer.domElement.focus({preventScroll:!0}),Fn()}function Ps(){yt==="play"&&(yt="pause",An.enabled=!1,An.clear(),Sn.pause(),Xe.open("pause",Rt),Fn())}function Qd(s=null){Xe.close(),yt="play",Rt.newRun(nn.difficulty,s),Xe.didDash=!1,Xe.didPulse=!1,Fr()}function Ry(s,e){if(s==="reload"){location.reload();return}if(s==="language"){tf("language",nn.language==="sv"?"en":"sv");return}if(s==="how"||s==="settings"){yt==="play"&&Ps(),Jd=yt==="menu"?"menu":"pause",Xe.open(s,Rt);return}if(Ur)if(s==="start")Qd(Zt.checkpoint);else if(s==="new")Qd();else if(s==="pause")Ps();else if(s==="resume")Fr();else if(s==="close"){if(!["pause","settings","how"].includes(Xe.kind))return;Xe.kind==="pause"?Fr():Jd==="pause"?Xe.open("pause",Rt):Xe.close()}else s==="retry"?(yt="play",Rt.retry(),Fr()):s==="upgrade"?(Rt.advance(e),Fr()):s==="menu"&&(Xe.close(),yt="menu",An.enabled=!1,An.clear(),Sn.pause(),Rt.newRun(nn.difficulty),Xe.mode(yt),Xe.updateTitle(),ef=performance.now(),zt.setCamera("menu",!0),Fn())}function tf(s,e){Object.hasOwn(nn,s)&&(nn[s]=e,Object.assign(nn,Xi({...Zt,settings:nn}).settings),Ds(),Sn?.apply(),Xe.translate(),Xe.kind==="settings"&&(Xe.open("settings",Rt),Xe.modal.querySelector(`[data-setting="${s}"]`)?.focus({preventScroll:!0})),zt?.resize(),Fn())}function Iy(s,e){if(s==="loaded"){yt==="play"&&(Zt.unlocked=Math.max(Zt.unlocked,e.sector),Zt.checkpoint=e,Ds());return}if(s==="cell"){Xe.announce(Xe.t("cellFound"));return}if(s==="boss"){Xe.announce(Xe.t("bossDown"));return}if(s==="dash"){Xe.didDash=!0;return}if(s==="pulse"){Xe.didPulse=!0;return}s==="won"&&(Zt.best=Math.max(Zt.best,Rt.state.score),Zt.wins++,Zt.checkpoint=null,Zt.unlocked=2,Ds()),["dead","won","sector"].includes(s)&&(yt=s,An.enabled=!1,An.clear(),Sn.pause(),Sn.play(s==="dead"?"fail":"clear"),Xe.open(s,Rt),Fn())}async function Py(){try{Sn=new hl(nn),zt=new Ha(document.getElementById("world"),nn),zt.renderer.domElement.tabIndex=0,Rt=new al(zt,Sn,Iy),An=new ll(zt.renderer.domElement,Ps),await zt.renderer.compileAsync(zt.scene,zt.camera),zt.draw(Rt,yt,0,performance.now()/1e3),Ur=!0,Xe.ready(),Ns=performance.now(),Fn(),window.addEventListener("resize",()=>{An.clear(),zt.resize(),Fn()}),window.addEventListener("blur",Ps),document.addEventListener("visibilitychange",()=>{document.hidden?(Ps(),Sn.pause(),Ls&&cancelAnimationFrame(Ls),Ls=0):(Ns=performance.now(),Fn())}),zt.renderer.domElement.addEventListener("webglcontextlost",s=>{s.preventDefault(),Ps(),Ur=!1,Xe.open("error",Rt,Xe.t("contextLost"))}),new URLSearchParams(location.search).has("qa")&&Object.defineProperty(window,"__SKIFT__",{value:Object.freeze({snapshot:()=>({...Rt.snapshot(),mode:yt,audio:{active:Sn.active,music:!!Sn.music?.playing()},render:zt.stats(),perf:{frames:dn.frames,steps:dn.steps,maxCost:dn.maxCost,p95:[...dn.cost].sort((s,e)=>s-e)[Math.floor(dn.cost.length*.95)]||0},settings:{...nn}})})}),Ds()}catch(s){console.error("SKIFT startup failed",s),Xe.open("error",null,/webgl/i.test(String(s))?Xe.t("faultText"):Xe.t("startupError")),document.getElementById("load-status").textContent=Xe.t("fault")}}Py();})();
/*! For license information please see app.js.LEGAL.txt */
