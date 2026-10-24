(()=>{var pf=Object.create;var _h=Object.defineProperty;var mf=Object.getOwnPropertyDescriptor;var gf=Object.getOwnPropertyNames;var xf=Object.getPrototypeOf,_f=Object.prototype.hasOwnProperty;var vf=(r,e)=>()=>(e||r((e={exports:{}}).exports,e),e.exports);var yf=(r,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of gf(e))!_f.call(r,i)&&i!==t&&_h(r,i,{get:()=>e[i],enumerable:!(n=mf(e,i))||n.enumerable});return r};var bf=(r,e,t)=>(t=r!=null?pf(xf(r)):{},yf(e||!r||!r.__esModule?_h(t,"default",{value:r,enumerable:!0}):t,r));var nf=vf(hl=>{(function(){"use strict";var r=function(){this.init()};r.prototype={init:function(){var a=this||e;return a._counter=1e3,a._html5AudioPool=[],a.html5PoolSize=10,a._codecs={},a._howls=[],a._muted=!1,a._volume=1,a._canPlayEvent="canplaythrough",a._navigator=typeof window<"u"&&window.navigator?window.navigator:null,a.masterGain=null,a.noAudio=!1,a.usingWebAudio=!0,a.autoSuspend=!0,a.ctx=null,a.autoUnlock=!0,a._setup(),a},volume:function(a){var u=this||e;if(a=parseFloat(a),u.ctx||h(),typeof a<"u"&&a>=0&&a<=1){if(u._volume=a,u._muted)return u;u.usingWebAudio&&u.masterGain.gain.setValueAtTime(a,e.ctx.currentTime);for(var d=0;d<u._howls.length;d++)if(!u._howls[d]._webAudio)for(var f=u._howls[d]._getSoundIds(),m=0;m<f.length;m++){var x=u._howls[d]._soundById(f[m]);x&&x._node&&(x._node.volume=x._volume*a)}return u}return u._volume},mute:function(a){var u=this||e;u.ctx||h(),u._muted=a,u.usingWebAudio&&u.masterGain.gain.setValueAtTime(a?0:u._volume,e.ctx.currentTime);for(var d=0;d<u._howls.length;d++)if(!u._howls[d]._webAudio)for(var f=u._howls[d]._getSoundIds(),m=0;m<f.length;m++){var x=u._howls[d]._soundById(f[m]);x&&x._node&&(x._node.muted=a?!0:x._muted)}return u},stop:function(){for(var a=this||e,u=0;u<a._howls.length;u++)a._howls[u].stop();return a},unload:function(){for(var a=this||e,u=a._howls.length-1;u>=0;u--)a._howls[u].unload();return a.usingWebAudio&&a.ctx&&typeof a.ctx.close<"u"&&(a.ctx.close(),a.ctx=null,h()),a},codecs:function(a){return(this||e)._codecs[a.replace(/^x-/,"")]},_setup:function(){var a=this||e;if(a.state=a.ctx&&a.ctx.state||"suspended",a._autoSuspend(),!a.usingWebAudio)if(typeof Audio<"u")try{var u=new Audio;typeof u.oncanplaythrough>"u"&&(a._canPlayEvent="canplay")}catch{a.noAudio=!0}else a.noAudio=!0;try{var u=new Audio;u.muted&&(a.noAudio=!0)}catch{}return a.noAudio||a._setupCodecs(),a},_setupCodecs:function(){var a=this||e,u=null;try{u=typeof Audio<"u"?new Audio:null}catch{return a}if(!u||typeof u.canPlayType!="function")return a;var d=u.canPlayType("audio/mpeg;").replace(/^no$/,""),f=a._navigator?a._navigator.userAgent:"",m=f.match(/OPR\/(\d+)/g),x=m&&parseInt(m[0].split("/")[1],10)<33,p=f.indexOf("Safari")!==-1&&f.indexOf("Chrome")===-1,g=f.match(/Version\/(.*?) /),_=p&&g&&parseInt(g[1],10)<15;return a._codecs={mp3:!!(!x&&(d||u.canPlayType("audio/mp3;").replace(/^no$/,""))),mpeg:!!d,opus:!!u.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!u.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!u.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!(u.canPlayType('audio/wav; codecs="1"')||u.canPlayType("audio/wav")).replace(/^no$/,""),aac:!!u.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!u.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(u.canPlayType("audio/x-m4a;")||u.canPlayType("audio/m4a;")||u.canPlayType("audio/aac;")).replace(/^no$/,""),m4b:!!(u.canPlayType("audio/x-m4b;")||u.canPlayType("audio/m4b;")||u.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(u.canPlayType("audio/x-mp4;")||u.canPlayType("audio/mp4;")||u.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!!(!_&&u.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),webm:!!(!_&&u.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),dolby:!!u.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(u.canPlayType("audio/x-flac;")||u.canPlayType("audio/flac;")).replace(/^no$/,"")},a},_unlockAudio:function(){var a=this||e;if(!(a._audioUnlocked||!a.ctx)){a._audioUnlocked=!1,a.autoUnlock=!1,!a._mobileUnloaded&&a.ctx.sampleRate!==44100&&(a._mobileUnloaded=!0,a.unload()),a._scratchBuffer=a.ctx.createBuffer(1,1,22050);var u=function(d){for(;a._html5AudioPool.length<a.html5PoolSize;)try{var f=new Audio;f._unlocked=!0,a._releaseHtml5Audio(f)}catch{a.noAudio=!0;break}for(var m=0;m<a._howls.length;m++)if(!a._howls[m]._webAudio)for(var x=a._howls[m]._getSoundIds(),p=0;p<x.length;p++){var g=a._howls[m]._soundById(x[p]);g&&g._node&&!g._node._unlocked&&(g._node._unlocked=!0,g._node.load())}a._autoResume();var _=a.ctx.createBufferSource();_.buffer=a._scratchBuffer,_.connect(a.ctx.destination),typeof _.start>"u"?_.noteOn(0):_.start(0),typeof a.ctx.resume=="function"&&a.ctx.resume(),_.onended=function(){_.disconnect(0),a._audioUnlocked=!0,document.removeEventListener("touchstart",u,!0),document.removeEventListener("touchend",u,!0),document.removeEventListener("click",u,!0),document.removeEventListener("keydown",u,!0);for(var y=0;y<a._howls.length;y++)a._howls[y]._emit("unlock")}};return document.addEventListener("touchstart",u,!0),document.addEventListener("touchend",u,!0),document.addEventListener("click",u,!0),document.addEventListener("keydown",u,!0),a}},_obtainHtml5Audio:function(){var a=this||e;if(a._html5AudioPool.length)return a._html5AudioPool.pop();var u=new Audio().play();return u&&typeof Promise<"u"&&(u instanceof Promise||typeof u.then=="function")&&u.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(a){var u=this||e;return a._unlocked&&u._html5AudioPool.push(a),u},_autoSuspend:function(){var a=this;if(!(!a.autoSuspend||!a.ctx||typeof a.ctx.suspend>"u"||!e.usingWebAudio)){for(var u=0;u<a._howls.length;u++)if(a._howls[u]._webAudio){for(var d=0;d<a._howls[u]._sounds.length;d++)if(!a._howls[u]._sounds[d]._paused)return a}return a._suspendTimer&&clearTimeout(a._suspendTimer),a._suspendTimer=setTimeout(function(){if(a.autoSuspend){a._suspendTimer=null,a.state="suspending";var f=function(){a.state="suspended",a._resumeAfterSuspend&&(delete a._resumeAfterSuspend,a._autoResume())};a.ctx.suspend().then(f,f)}},3e4),a}},_autoResume:function(){var a=this;if(!(!a.ctx||typeof a.ctx.resume>"u"||!e.usingWebAudio))return a.state==="running"&&a.ctx.state!=="interrupted"&&a._suspendTimer?(clearTimeout(a._suspendTimer),a._suspendTimer=null):a.state==="suspended"||a.state==="running"&&a.ctx.state==="interrupted"?(a.ctx.resume().then(function(){a.state="running";for(var u=0;u<a._howls.length;u++)a._howls[u]._emit("resume")}),a._suspendTimer&&(clearTimeout(a._suspendTimer),a._suspendTimer=null)):a.state==="suspending"&&(a._resumeAfterSuspend=!0),a}};var e=new r,t=function(a){var u=this;if(!a.src||a.src.length===0){console.error("An array of source files must be passed with any new Howl.");return}u.init(a)};t.prototype={init:function(a){var u=this;return e.ctx||h(),u._autoplay=a.autoplay||!1,u._format=typeof a.format!="string"?a.format:[a.format],u._html5=a.html5||!1,u._muted=a.mute||!1,u._loop=a.loop||!1,u._pool=a.pool||5,u._preload=typeof a.preload=="boolean"||a.preload==="metadata"?a.preload:!0,u._rate=a.rate||1,u._sprite=a.sprite||{},u._src=typeof a.src!="string"?a.src:[a.src],u._volume=a.volume!==void 0?a.volume:1,u._xhr={method:a.xhr&&a.xhr.method?a.xhr.method:"GET",headers:a.xhr&&a.xhr.headers?a.xhr.headers:null,withCredentials:a.xhr&&a.xhr.withCredentials?a.xhr.withCredentials:!1},u._duration=0,u._state="unloaded",u._sounds=[],u._endTimers={},u._queue=[],u._playLock=!1,u._onend=a.onend?[{fn:a.onend}]:[],u._onfade=a.onfade?[{fn:a.onfade}]:[],u._onload=a.onload?[{fn:a.onload}]:[],u._onloaderror=a.onloaderror?[{fn:a.onloaderror}]:[],u._onplayerror=a.onplayerror?[{fn:a.onplayerror}]:[],u._onpause=a.onpause?[{fn:a.onpause}]:[],u._onplay=a.onplay?[{fn:a.onplay}]:[],u._onstop=a.onstop?[{fn:a.onstop}]:[],u._onmute=a.onmute?[{fn:a.onmute}]:[],u._onvolume=a.onvolume?[{fn:a.onvolume}]:[],u._onrate=a.onrate?[{fn:a.onrate}]:[],u._onseek=a.onseek?[{fn:a.onseek}]:[],u._onunlock=a.onunlock?[{fn:a.onunlock}]:[],u._onresume=[],u._webAudio=e.usingWebAudio&&!u._html5,typeof e.ctx<"u"&&e.ctx&&e.autoUnlock&&e._unlockAudio(),e._howls.push(u),u._autoplay&&u._queue.push({event:"play",action:function(){u.play()}}),u._preload&&u._preload!=="none"&&u.load(),u},load:function(){var a=this,u=null;if(e.noAudio){a._emit("loaderror",null,"No audio support.");return}typeof a._src=="string"&&(a._src=[a._src]);for(var d=0;d<a._src.length;d++){var f,m;if(a._format&&a._format[d])f=a._format[d];else{if(m=a._src[d],typeof m!="string"){a._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}f=/^data:audio\/([^;,]+);/i.exec(m),f||(f=/\.([^.]+)$/.exec(m.split("?",1)[0])),f&&(f=f[1].toLowerCase())}if(f||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),f&&e.codecs(f)){u=a._src[d];break}}if(!u){a._emit("loaderror",null,"No codec support for selected audio sources.");return}return a._src=u,a._state="loading",window.location.protocol==="https:"&&u.slice(0,5)==="http:"&&(a._html5=!0,a._webAudio=!1),new n(a),a._webAudio&&s(a),a},play:function(a,u){var d=this,f=null;if(typeof a=="number")f=a,a=null;else{if(typeof a=="string"&&d._state==="loaded"&&!d._sprite[a])return null;if(typeof a>"u"&&(a="__default",!d._playLock)){for(var m=0,x=0;x<d._sounds.length;x++)d._sounds[x]._paused&&!d._sounds[x]._ended&&(m++,f=d._sounds[x]._id);m===1?a=null:f=null}}var p=f?d._soundById(f):d._inactiveSound();if(!p)return null;if(f&&!a&&(a=p._sprite||"__default"),d._state!=="loaded"){p._sprite=a,p._ended=!1;var g=p._id;return d._queue.push({event:"play",action:function(){d.play(g)}}),g}if(f&&!p._paused)return u||d._loadQueue("play"),p._id;d._webAudio&&e._autoResume();var _=Math.max(0,p._seek>0?p._seek:d._sprite[a][0]/1e3),y=Math.max(0,(d._sprite[a][0]+d._sprite[a][1])/1e3-_),v=y*1e3/Math.abs(p._rate),T=d._sprite[a][0]/1e3,A=(d._sprite[a][0]+d._sprite[a][1])/1e3;p._sprite=a,p._ended=!1;var C=function(){p._paused=!1,p._seek=_,p._start=T,p._stop=A,p._loop=!!(p._loop||d._sprite[a][2])};if(_>=A){d._ended(p);return}var R=p._node;if(d._webAudio){var M=function(){d._playLock=!1,C(),d._refreshBuffer(p);var L=p._muted||d._muted?0:p._volume;R.gain.setValueAtTime(L,e.ctx.currentTime),p._playStart=e.ctx.currentTime,typeof R.bufferSource.start>"u"?p._loop?R.bufferSource.noteGrainOn(0,_,86400):R.bufferSource.noteGrainOn(0,_,y):p._loop?R.bufferSource.start(0,_,86400):R.bufferSource.start(0,_,y),v!==1/0&&(d._endTimers[p._id]=setTimeout(d._ended.bind(d,p),v)),u||setTimeout(function(){d._emit("play",p._id),d._loadQueue()},0)};e.state==="running"&&e.ctx.state!=="interrupted"?M():(d._playLock=!0,d.once("resume",M),d._clearTimer(p._id))}else{var b=function(){R.currentTime=_,R.muted=p._muted||d._muted||e._muted||R.muted,R.volume=p._volume*e.volume(),R.playbackRate=p._rate;try{var L=R.play();if(L&&typeof Promise<"u"&&(L instanceof Promise||typeof L.then=="function")?(d._playLock=!0,C(),L.then(function(){d._playLock=!1,R._unlocked=!0,u?d._loadQueue():d._emit("play",p._id)}).catch(function(){d._playLock=!1,d._emit("playerror",p._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),p._ended=!0,p._paused=!0})):u||(d._playLock=!1,C(),d._emit("play",p._id)),R.playbackRate=p._rate,R.paused){d._emit("playerror",p._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");return}a!=="__default"||p._loop?d._endTimers[p._id]=setTimeout(d._ended.bind(d,p),v):(d._endTimers[p._id]=function(){d._ended(p),R.removeEventListener("ended",d._endTimers[p._id],!1)},R.addEventListener("ended",d._endTimers[p._id],!1))}catch(U){d._emit("playerror",p._id,U)}};R.src==="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"&&(R.src=d._src,R.load());var P=window&&window.ejecta||!R.readyState&&e._navigator.isCocoonJS;if(R.readyState>=3||P)b();else{d._playLock=!0,d._state="loading";var B=function(){d._state="loaded",b(),R.removeEventListener(e._canPlayEvent,B,!1)};R.addEventListener(e._canPlayEvent,B,!1),d._clearTimer(p._id)}}return p._id},pause:function(a){var u=this;if(u._state!=="loaded"||u._playLock)return u._queue.push({event:"pause",action:function(){u.pause(a)}}),u;for(var d=u._getSoundIds(a),f=0;f<d.length;f++){u._clearTimer(d[f]);var m=u._soundById(d[f]);if(m&&!m._paused&&(m._seek=u.seek(d[f]),m._rateSeek=0,m._paused=!0,u._stopFade(d[f]),m._node))if(u._webAudio){if(!m._node.bufferSource)continue;typeof m._node.bufferSource.stop>"u"?m._node.bufferSource.noteOff(0):m._node.bufferSource.stop(0),u._cleanBuffer(m._node)}else(!isNaN(m._node.duration)||m._node.duration===1/0)&&m._node.pause();arguments[1]||u._emit("pause",m?m._id:null)}return u},stop:function(a,u){var d=this;if(d._state!=="loaded"||d._playLock)return d._queue.push({event:"stop",action:function(){d.stop(a)}}),d;for(var f=d._getSoundIds(a),m=0;m<f.length;m++){d._clearTimer(f[m]);var x=d._soundById(f[m]);x&&(x._seek=x._start||0,x._rateSeek=0,x._paused=!0,x._ended=!0,d._stopFade(f[m]),x._node&&(d._webAudio?x._node.bufferSource&&(typeof x._node.bufferSource.stop>"u"?x._node.bufferSource.noteOff(0):x._node.bufferSource.stop(0),d._cleanBuffer(x._node)):(!isNaN(x._node.duration)||x._node.duration===1/0)&&(x._node.currentTime=x._start||0,x._node.pause(),x._node.duration===1/0&&d._clearSound(x._node))),u||d._emit("stop",x._id))}return d},mute:function(a,u){var d=this;if(d._state!=="loaded"||d._playLock)return d._queue.push({event:"mute",action:function(){d.mute(a,u)}}),d;if(typeof u>"u")if(typeof a=="boolean")d._muted=a;else return d._muted;for(var f=d._getSoundIds(u),m=0;m<f.length;m++){var x=d._soundById(f[m]);x&&(x._muted=a,x._interval&&d._stopFade(x._id),d._webAudio&&x._node?x._node.gain.setValueAtTime(a?0:x._volume,e.ctx.currentTime):x._node&&(x._node.muted=e._muted?!0:a),d._emit("mute",x._id))}return d},volume:function(){var a=this,u=arguments,d,f;if(u.length===0)return a._volume;if(u.length===1||u.length===2&&typeof u[1]>"u"){var m=a._getSoundIds(),x=m.indexOf(u[0]);x>=0?f=parseInt(u[0],10):d=parseFloat(u[0])}else u.length>=2&&(d=parseFloat(u[0]),f=parseInt(u[1],10));var p;if(typeof d<"u"&&d>=0&&d<=1){if(a._state!=="loaded"||a._playLock)return a._queue.push({event:"volume",action:function(){a.volume.apply(a,u)}}),a;typeof f>"u"&&(a._volume=d),f=a._getSoundIds(f);for(var g=0;g<f.length;g++)p=a._soundById(f[g]),p&&(p._volume=d,u[2]||a._stopFade(f[g]),a._webAudio&&p._node&&!p._muted?p._node.gain.setValueAtTime(d,e.ctx.currentTime):p._node&&!p._muted&&(p._node.volume=d*e.volume()),a._emit("volume",p._id))}else return p=f?a._soundById(f):a._sounds[0],p?p._volume:0;return a},fade:function(a,u,d,f){var m=this;if(m._state!=="loaded"||m._playLock)return m._queue.push({event:"fade",action:function(){m.fade(a,u,d,f)}}),m;a=Math.min(Math.max(0,parseFloat(a)),1),u=Math.min(Math.max(0,parseFloat(u)),1),d=parseFloat(d),m.volume(a,f);for(var x=m._getSoundIds(f),p=0;p<x.length;p++){var g=m._soundById(x[p]);if(g){if(f||m._stopFade(x[p]),m._webAudio&&!g._muted){var _=e.ctx.currentTime,y=_+d/1e3;g._volume=a,g._node.gain.setValueAtTime(a,_),g._node.gain.linearRampToValueAtTime(u,y)}m._startFadeInterval(g,a,u,d,x[p],typeof f>"u")}}return m},_startFadeInterval:function(a,u,d,f,m,x){var p=this,g=u,_=d-u,y=Math.abs(_/.01),v=Math.max(4,y>0?f/y:f),T=Date.now();a._fadeTo=d,a._interval=setInterval(function(){var A=(Date.now()-T)/f;T=Date.now(),g+=_*A,g=Math.round(g*100)/100,_<0?g=Math.max(d,g):g=Math.min(d,g),p._webAudio?a._volume=g:p.volume(g,a._id,!0),x&&(p._volume=g),(d<u&&g<=d||d>u&&g>=d)&&(clearInterval(a._interval),a._interval=null,a._fadeTo=null,p.volume(d,a._id),p._emit("fade",a._id))},v)},_stopFade:function(a){var u=this,d=u._soundById(a);return d&&d._interval&&(u._webAudio&&d._node.gain.cancelScheduledValues(e.ctx.currentTime),clearInterval(d._interval),d._interval=null,u.volume(d._fadeTo,a),d._fadeTo=null,u._emit("fade",a)),u},loop:function(){var a=this,u=arguments,d,f,m;if(u.length===0)return a._loop;if(u.length===1)if(typeof u[0]=="boolean")d=u[0],a._loop=d;else return m=a._soundById(parseInt(u[0],10)),m?m._loop:!1;else u.length===2&&(d=u[0],f=parseInt(u[1],10));for(var x=a._getSoundIds(f),p=0;p<x.length;p++)m=a._soundById(x[p]),m&&(m._loop=d,a._webAudio&&m._node&&m._node.bufferSource&&(m._node.bufferSource.loop=d,d&&(m._node.bufferSource.loopStart=m._start||0,m._node.bufferSource.loopEnd=m._stop,a.playing(x[p])&&(a.pause(x[p],!0),a.play(x[p],!0)))));return a},rate:function(){var a=this,u=arguments,d,f;if(u.length===0)f=a._sounds[0]._id;else if(u.length===1){var m=a._getSoundIds(),x=m.indexOf(u[0]);x>=0?f=parseInt(u[0],10):d=parseFloat(u[0])}else u.length===2&&(d=parseFloat(u[0]),f=parseInt(u[1],10));var p;if(typeof d=="number"){if(a._state!=="loaded"||a._playLock)return a._queue.push({event:"rate",action:function(){a.rate.apply(a,u)}}),a;typeof f>"u"&&(a._rate=d),f=a._getSoundIds(f);for(var g=0;g<f.length;g++)if(p=a._soundById(f[g]),p){a.playing(f[g])&&(p._rateSeek=a.seek(f[g]),p._playStart=a._webAudio?e.ctx.currentTime:p._playStart),p._rate=d,a._webAudio&&p._node&&p._node.bufferSource?p._node.bufferSource.playbackRate.setValueAtTime(d,e.ctx.currentTime):p._node&&(p._node.playbackRate=d);var _=a.seek(f[g]),y=(a._sprite[p._sprite][0]+a._sprite[p._sprite][1])/1e3-_,v=y*1e3/Math.abs(p._rate);(a._endTimers[f[g]]||!p._paused)&&(a._clearTimer(f[g]),a._endTimers[f[g]]=setTimeout(a._ended.bind(a,p),v)),a._emit("rate",p._id)}}else return p=a._soundById(f),p?p._rate:a._rate;return a},seek:function(){var a=this,u=arguments,d,f;if(u.length===0)a._sounds.length&&(f=a._sounds[0]._id);else if(u.length===1){var m=a._getSoundIds(),x=m.indexOf(u[0]);x>=0?f=parseInt(u[0],10):a._sounds.length&&(f=a._sounds[0]._id,d=parseFloat(u[0]))}else u.length===2&&(d=parseFloat(u[0]),f=parseInt(u[1],10));if(typeof f>"u")return 0;if(typeof d=="number"&&(a._state!=="loaded"||a._playLock))return a._queue.push({event:"seek",action:function(){a.seek.apply(a,u)}}),a;var p=a._soundById(f);if(p)if(typeof d=="number"&&d>=0){var g=a.playing(f);g&&a.pause(f,!0),p._seek=d,p._ended=!1,a._clearTimer(f),!a._webAudio&&p._node&&!isNaN(p._node.duration)&&(p._node.currentTime=d);var _=function(){g&&a.play(f,!0),a._emit("seek",f)};if(g&&!a._webAudio){var y=function(){a._playLock?setTimeout(y,0):_()};setTimeout(y,0)}else _()}else if(a._webAudio){var v=a.playing(f)?e.ctx.currentTime-p._playStart:0,T=p._rateSeek?p._rateSeek-p._seek:0;return p._seek+(T+v*Math.abs(p._rate))}else return p._node.currentTime;return a},playing:function(a){var u=this;if(typeof a=="number"){var d=u._soundById(a);return d?!d._paused:!1}for(var f=0;f<u._sounds.length;f++)if(!u._sounds[f]._paused)return!0;return!1},duration:function(a){var u=this,d=u._duration,f=u._soundById(a);return f&&(d=u._sprite[f._sprite][1]/1e3),d},state:function(){return this._state},unload:function(){for(var a=this,u=a._sounds,d=0;d<u.length;d++)u[d]._paused||a.stop(u[d]._id),a._webAudio||(a._clearSound(u[d]._node),u[d]._node.removeEventListener("error",u[d]._errorFn,!1),u[d]._node.removeEventListener(e._canPlayEvent,u[d]._loadFn,!1),u[d]._node.removeEventListener("ended",u[d]._endFn,!1),e._releaseHtml5Audio(u[d]._node)),delete u[d]._node,a._clearTimer(u[d]._id);var f=e._howls.indexOf(a);f>=0&&e._howls.splice(f,1);var m=!0;for(d=0;d<e._howls.length;d++)if(e._howls[d]._src===a._src||a._src.indexOf(e._howls[d]._src)>=0){m=!1;break}return i&&m&&delete i[a._src],e.noAudio=!1,a._state="unloaded",a._sounds=[],a=null,null},on:function(a,u,d,f){var m=this,x=m["_on"+a];return typeof u=="function"&&x.push(f?{id:d,fn:u,once:f}:{id:d,fn:u}),m},off:function(a,u,d){var f=this,m=f["_on"+a],x=0;if(typeof u=="number"&&(d=u,u=null),u||d)for(x=0;x<m.length;x++){var p=d===m[x].id;if(u===m[x].fn&&p||!u&&p){m.splice(x,1);break}}else if(a)f["_on"+a]=[];else{var g=Object.keys(f);for(x=0;x<g.length;x++)g[x].indexOf("_on")===0&&Array.isArray(f[g[x]])&&(f[g[x]]=[])}return f},once:function(a,u,d){var f=this;return f.on(a,u,d,1),f},_emit:function(a,u,d){for(var f=this,m=f["_on"+a],x=m.length-1;x>=0;x--)(!m[x].id||m[x].id===u||a==="load")&&(setTimeout((function(p){p.call(this,u,d)}).bind(f,m[x].fn),0),m[x].once&&f.off(a,m[x].fn,m[x].id));return f._loadQueue(a),f},_loadQueue:function(a){var u=this;if(u._queue.length>0){var d=u._queue[0];d.event===a&&(u._queue.shift(),u._loadQueue()),a||d.action()}return u},_ended:function(a){var u=this,d=a._sprite;if(!u._webAudio&&a._node&&!a._node.paused&&!a._node.ended&&a._node.currentTime<a._stop)return setTimeout(u._ended.bind(u,a),100),u;var f=!!(a._loop||u._sprite[d][2]);if(u._emit("end",a._id),!u._webAudio&&f&&u.stop(a._id,!0).play(a._id),u._webAudio&&f){u._emit("play",a._id),a._seek=a._start||0,a._rateSeek=0,a._playStart=e.ctx.currentTime;var m=(a._stop-a._start)*1e3/Math.abs(a._rate);u._endTimers[a._id]=setTimeout(u._ended.bind(u,a),m)}return u._webAudio&&!f&&(a._paused=!0,a._ended=!0,a._seek=a._start||0,a._rateSeek=0,u._clearTimer(a._id),u._cleanBuffer(a._node),e._autoSuspend()),!u._webAudio&&!f&&u.stop(a._id,!0),u},_clearTimer:function(a){var u=this;if(u._endTimers[a]){if(typeof u._endTimers[a]!="function")clearTimeout(u._endTimers[a]);else{var d=u._soundById(a);d&&d._node&&d._node.removeEventListener("ended",u._endTimers[a],!1)}delete u._endTimers[a]}return u},_soundById:function(a){for(var u=this,d=0;d<u._sounds.length;d++)if(a===u._sounds[d]._id)return u._sounds[d];return null},_inactiveSound:function(){var a=this;a._drain();for(var u=0;u<a._sounds.length;u++)if(a._sounds[u]._ended)return a._sounds[u].reset();return new n(a)},_drain:function(){var a=this,u=a._pool,d=0,f=0;if(!(a._sounds.length<u)){for(f=0;f<a._sounds.length;f++)a._sounds[f]._ended&&d++;for(f=a._sounds.length-1;f>=0;f--){if(d<=u)return;a._sounds[f]._ended&&(a._webAudio&&a._sounds[f]._node&&a._sounds[f]._node.disconnect(0),a._sounds.splice(f,1),d--)}}},_getSoundIds:function(a){var u=this;if(typeof a>"u"){for(var d=[],f=0;f<u._sounds.length;f++)d.push(u._sounds[f]._id);return d}else return[a]},_refreshBuffer:function(a){var u=this;return a._node.bufferSource=e.ctx.createBufferSource(),a._node.bufferSource.buffer=i[u._src],a._panner?a._node.bufferSource.connect(a._panner):a._node.bufferSource.connect(a._node),a._node.bufferSource.loop=a._loop,a._loop&&(a._node.bufferSource.loopStart=a._start||0,a._node.bufferSource.loopEnd=a._stop||0),a._node.bufferSource.playbackRate.setValueAtTime(a._rate,e.ctx.currentTime),u},_cleanBuffer:function(a){var u=this,d=e._navigator&&e._navigator.vendor.indexOf("Apple")>=0;if(!a.bufferSource)return u;if(e._scratchBuffer&&a.bufferSource&&(a.bufferSource.onended=null,a.bufferSource.disconnect(0),d))try{a.bufferSource.buffer=e._scratchBuffer}catch{}return a.bufferSource=null,u},_clearSound:function(a){var u=/MSIE |Trident\//.test(e._navigator&&e._navigator.userAgent);u||(a.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var n=function(a){this._parent=a,this.init()};n.prototype={init:function(){var a=this,u=a._parent;return a._muted=u._muted,a._loop=u._loop,a._volume=u._volume,a._rate=u._rate,a._seek=0,a._paused=!0,a._ended=!0,a._sprite="__default",a._id=++e._counter,u._sounds.push(a),a.create(),a},create:function(){var a=this,u=a._parent,d=e._muted||a._muted||a._parent._muted?0:a._volume;return u._webAudio?(a._node=typeof e.ctx.createGain>"u"?e.ctx.createGainNode():e.ctx.createGain(),a._node.gain.setValueAtTime(d,e.ctx.currentTime),a._node.paused=!0,a._node.connect(e.masterGain)):e.noAudio||(a._node=e._obtainHtml5Audio(),a._errorFn=a._errorListener.bind(a),a._node.addEventListener("error",a._errorFn,!1),a._loadFn=a._loadListener.bind(a),a._node.addEventListener(e._canPlayEvent,a._loadFn,!1),a._endFn=a._endListener.bind(a),a._node.addEventListener("ended",a._endFn,!1),a._node.src=u._src,a._node.preload=u._preload===!0?"auto":u._preload,a._node.volume=d*e.volume(),a._node.load()),a},reset:function(){var a=this,u=a._parent;return a._muted=u._muted,a._loop=u._loop,a._volume=u._volume,a._rate=u._rate,a._seek=0,a._rateSeek=0,a._paused=!0,a._ended=!0,a._sprite="__default",a._id=++e._counter,a},_errorListener:function(){var a=this;a._parent._emit("loaderror",a._id,a._node.error?a._node.error.code:0),a._node.removeEventListener("error",a._errorFn,!1)},_loadListener:function(){var a=this,u=a._parent;u._duration=Math.ceil(a._node.duration*10)/10,Object.keys(u._sprite).length===0&&(u._sprite={__default:[0,u._duration*1e3]}),u._state!=="loaded"&&(u._state="loaded",u._emit("load"),u._loadQueue()),a._node.removeEventListener(e._canPlayEvent,a._loadFn,!1)},_endListener:function(){var a=this,u=a._parent;u._duration===1/0&&(u._duration=Math.ceil(a._node.duration*10)/10,u._sprite.__default[1]===1/0&&(u._sprite.__default[1]=u._duration*1e3),u._ended(a)),a._node.removeEventListener("ended",a._endFn,!1)}};var i={},s=function(a){var u=a._src;if(i[u]){a._duration=i[u].duration,c(a);return}if(/^data:[^;]+;base64,/.test(u)){for(var d=atob(u.split(",")[1]),f=new Uint8Array(d.length),m=0;m<d.length;++m)f[m]=d.charCodeAt(m);l(f.buffer,a)}else{var x=new XMLHttpRequest;x.open(a._xhr.method,u,!0),x.withCredentials=a._xhr.withCredentials,x.responseType="arraybuffer",a._xhr.headers&&Object.keys(a._xhr.headers).forEach(function(p){x.setRequestHeader(p,a._xhr.headers[p])}),x.onload=function(){var p=(x.status+"")[0];if(p!=="0"&&p!=="2"&&p!=="3"){a._emit("loaderror",null,"Failed loading audio file with status: "+x.status+".");return}l(x.response,a)},x.onerror=function(){a._webAudio&&(a._html5=!0,a._webAudio=!1,a._sounds=[],delete i[u],a.load())},o(x)}},o=function(a){try{a.send()}catch{a.onerror()}},l=function(a,u){var d=function(){u._emit("loaderror",null,"Decoding audio data failed.")},f=function(m){m&&u._sounds.length>0?(i[u._src]=m,c(u,m)):d()};typeof Promise<"u"&&e.ctx.decodeAudioData.length===1?e.ctx.decodeAudioData(a).then(f).catch(d):e.ctx.decodeAudioData(a,f,d)},c=function(a,u){u&&!a._duration&&(a._duration=u.duration),Object.keys(a._sprite).length===0&&(a._sprite={__default:[0,a._duration*1e3]}),a._state!=="loaded"&&(a._state="loaded",a._emit("load"),a._loadQueue())},h=function(){if(e.usingWebAudio){try{typeof AudioContext<"u"?e.ctx=new AudioContext:typeof webkitAudioContext<"u"?e.ctx=new webkitAudioContext:e.usingWebAudio=!1}catch{e.usingWebAudio=!1}e.ctx||(e.usingWebAudio=!1);var a=/iP(hone|od|ad)/.test(e._navigator&&e._navigator.platform),u=e._navigator&&e._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),d=u?parseInt(u[1],10):null;if(a&&d&&d<9){var f=/safari/.test(e._navigator&&e._navigator.userAgent.toLowerCase());e._navigator&&!f&&(e.usingWebAudio=!1)}e.usingWebAudio&&(e.masterGain=typeof e.ctx.createGain>"u"?e.ctx.createGainNode():e.ctx.createGain(),e.masterGain.gain.setValueAtTime(e._muted?0:e._volume,e.ctx.currentTime),e.masterGain.connect(e.ctx.destination)),e._setup()}};typeof define=="function"&&define.amd&&define([],function(){return{Howler:e,Howl:t}}),typeof hl<"u"&&(hl.Howler=e,hl.Howl=t),typeof global<"u"?(global.HowlerGlobal=r,global.Howler=e,global.Howl=t,global.Sound=n):typeof window<"u"&&(window.HowlerGlobal=r,window.Howler=e,window.Howl=t,window.Sound=n)})();(function(){"use strict";HowlerGlobal.prototype._pos=[0,0,0],HowlerGlobal.prototype._orientation=[0,0,-1,0,1,0],HowlerGlobal.prototype.stereo=function(e){var t=this;if(!t.ctx||!t.ctx.listener)return t;for(var n=t._howls.length-1;n>=0;n--)t._howls[n].stereo(e);return t},HowlerGlobal.prototype.pos=function(e,t,n){var i=this;if(!i.ctx||!i.ctx.listener)return i;if(t=typeof t!="number"?i._pos[1]:t,n=typeof n!="number"?i._pos[2]:n,typeof e=="number")i._pos=[e,t,n],typeof i.ctx.listener.positionX<"u"?(i.ctx.listener.positionX.setTargetAtTime(i._pos[0],Howler.ctx.currentTime,.1),i.ctx.listener.positionY.setTargetAtTime(i._pos[1],Howler.ctx.currentTime,.1),i.ctx.listener.positionZ.setTargetAtTime(i._pos[2],Howler.ctx.currentTime,.1)):i.ctx.listener.setPosition(i._pos[0],i._pos[1],i._pos[2]);else return i._pos;return i},HowlerGlobal.prototype.orientation=function(e,t,n,i,s,o){var l=this;if(!l.ctx||!l.ctx.listener)return l;var c=l._orientation;if(t=typeof t!="number"?c[1]:t,n=typeof n!="number"?c[2]:n,i=typeof i!="number"?c[3]:i,s=typeof s!="number"?c[4]:s,o=typeof o!="number"?c[5]:o,typeof e=="number")l._orientation=[e,t,n,i,s,o],typeof l.ctx.listener.forwardX<"u"?(l.ctx.listener.forwardX.setTargetAtTime(e,Howler.ctx.currentTime,.1),l.ctx.listener.forwardY.setTargetAtTime(t,Howler.ctx.currentTime,.1),l.ctx.listener.forwardZ.setTargetAtTime(n,Howler.ctx.currentTime,.1),l.ctx.listener.upX.setTargetAtTime(i,Howler.ctx.currentTime,.1),l.ctx.listener.upY.setTargetAtTime(s,Howler.ctx.currentTime,.1),l.ctx.listener.upZ.setTargetAtTime(o,Howler.ctx.currentTime,.1)):l.ctx.listener.setOrientation(e,t,n,i,s,o);else return c;return l},Howl.prototype.init=(function(e){return function(t){var n=this;return n._orientation=t.orientation||[1,0,0],n._stereo=t.stereo||null,n._pos=t.pos||null,n._pannerAttr={coneInnerAngle:typeof t.coneInnerAngle<"u"?t.coneInnerAngle:360,coneOuterAngle:typeof t.coneOuterAngle<"u"?t.coneOuterAngle:360,coneOuterGain:typeof t.coneOuterGain<"u"?t.coneOuterGain:0,distanceModel:typeof t.distanceModel<"u"?t.distanceModel:"inverse",maxDistance:typeof t.maxDistance<"u"?t.maxDistance:1e4,panningModel:typeof t.panningModel<"u"?t.panningModel:"HRTF",refDistance:typeof t.refDistance<"u"?t.refDistance:1,rolloffFactor:typeof t.rolloffFactor<"u"?t.rolloffFactor:1},n._onstereo=t.onstereo?[{fn:t.onstereo}]:[],n._onpos=t.onpos?[{fn:t.onpos}]:[],n._onorientation=t.onorientation?[{fn:t.onorientation}]:[],e.call(this,t)}})(Howl.prototype.init),Howl.prototype.stereo=function(e,t){var n=this;if(!n._webAudio)return n;if(n._state!=="loaded")return n._queue.push({event:"stereo",action:function(){n.stereo(e,t)}}),n;var i=typeof Howler.ctx.createStereoPanner>"u"?"spatial":"stereo";if(typeof t>"u")if(typeof e=="number")n._stereo=e,n._pos=[e,0,0];else return n._stereo;for(var s=n._getSoundIds(t),o=0;o<s.length;o++){var l=n._soundById(s[o]);if(l)if(typeof e=="number")l._stereo=e,l._pos=[e,0,0],l._node&&(l._pannerAttr.panningModel="equalpower",(!l._panner||!l._panner.pan)&&r(l,i),i==="spatial"?typeof l._panner.positionX<"u"?(l._panner.positionX.setValueAtTime(e,Howler.ctx.currentTime),l._panner.positionY.setValueAtTime(0,Howler.ctx.currentTime),l._panner.positionZ.setValueAtTime(0,Howler.ctx.currentTime)):l._panner.setPosition(e,0,0):l._panner.pan.setValueAtTime(e,Howler.ctx.currentTime)),n._emit("stereo",l._id);else return l._stereo}return n},Howl.prototype.pos=function(e,t,n,i){var s=this;if(!s._webAudio)return s;if(s._state!=="loaded")return s._queue.push({event:"pos",action:function(){s.pos(e,t,n,i)}}),s;if(t=typeof t!="number"?0:t,n=typeof n!="number"?-.5:n,typeof i>"u")if(typeof e=="number")s._pos=[e,t,n];else return s._pos;for(var o=s._getSoundIds(i),l=0;l<o.length;l++){var c=s._soundById(o[l]);if(c)if(typeof e=="number")c._pos=[e,t,n],c._node&&((!c._panner||c._panner.pan)&&r(c,"spatial"),typeof c._panner.positionX<"u"?(c._panner.positionX.setValueAtTime(e,Howler.ctx.currentTime),c._panner.positionY.setValueAtTime(t,Howler.ctx.currentTime),c._panner.positionZ.setValueAtTime(n,Howler.ctx.currentTime)):c._panner.setPosition(e,t,n)),s._emit("pos",c._id);else return c._pos}return s},Howl.prototype.orientation=function(e,t,n,i){var s=this;if(!s._webAudio)return s;if(s._state!=="loaded")return s._queue.push({event:"orientation",action:function(){s.orientation(e,t,n,i)}}),s;if(t=typeof t!="number"?s._orientation[1]:t,n=typeof n!="number"?s._orientation[2]:n,typeof i>"u")if(typeof e=="number")s._orientation=[e,t,n];else return s._orientation;for(var o=s._getSoundIds(i),l=0;l<o.length;l++){var c=s._soundById(o[l]);if(c)if(typeof e=="number")c._orientation=[e,t,n],c._node&&(c._panner||(c._pos||(c._pos=s._pos||[0,0,-.5]),r(c,"spatial")),typeof c._panner.orientationX<"u"?(c._panner.orientationX.setValueAtTime(e,Howler.ctx.currentTime),c._panner.orientationY.setValueAtTime(t,Howler.ctx.currentTime),c._panner.orientationZ.setValueAtTime(n,Howler.ctx.currentTime)):c._panner.setOrientation(e,t,n)),s._emit("orientation",c._id);else return c._orientation}return s},Howl.prototype.pannerAttr=function(){var e=this,t=arguments,n,i,s;if(!e._webAudio)return e;if(t.length===0)return e._pannerAttr;if(t.length===1)if(typeof t[0]=="object")n=t[0],typeof i>"u"&&(n.pannerAttr||(n.pannerAttr={coneInnerAngle:n.coneInnerAngle,coneOuterAngle:n.coneOuterAngle,coneOuterGain:n.coneOuterGain,distanceModel:n.distanceModel,maxDistance:n.maxDistance,refDistance:n.refDistance,rolloffFactor:n.rolloffFactor,panningModel:n.panningModel}),e._pannerAttr={coneInnerAngle:typeof n.pannerAttr.coneInnerAngle<"u"?n.pannerAttr.coneInnerAngle:e._coneInnerAngle,coneOuterAngle:typeof n.pannerAttr.coneOuterAngle<"u"?n.pannerAttr.coneOuterAngle:e._coneOuterAngle,coneOuterGain:typeof n.pannerAttr.coneOuterGain<"u"?n.pannerAttr.coneOuterGain:e._coneOuterGain,distanceModel:typeof n.pannerAttr.distanceModel<"u"?n.pannerAttr.distanceModel:e._distanceModel,maxDistance:typeof n.pannerAttr.maxDistance<"u"?n.pannerAttr.maxDistance:e._maxDistance,refDistance:typeof n.pannerAttr.refDistance<"u"?n.pannerAttr.refDistance:e._refDistance,rolloffFactor:typeof n.pannerAttr.rolloffFactor<"u"?n.pannerAttr.rolloffFactor:e._rolloffFactor,panningModel:typeof n.pannerAttr.panningModel<"u"?n.pannerAttr.panningModel:e._panningModel});else return s=e._soundById(parseInt(t[0],10)),s?s._pannerAttr:e._pannerAttr;else t.length===2&&(n=t[0],i=parseInt(t[1],10));for(var o=e._getSoundIds(i),l=0;l<o.length;l++)if(s=e._soundById(o[l]),s){var c=s._pannerAttr;c={coneInnerAngle:typeof n.coneInnerAngle<"u"?n.coneInnerAngle:c.coneInnerAngle,coneOuterAngle:typeof n.coneOuterAngle<"u"?n.coneOuterAngle:c.coneOuterAngle,coneOuterGain:typeof n.coneOuterGain<"u"?n.coneOuterGain:c.coneOuterGain,distanceModel:typeof n.distanceModel<"u"?n.distanceModel:c.distanceModel,maxDistance:typeof n.maxDistance<"u"?n.maxDistance:c.maxDistance,refDistance:typeof n.refDistance<"u"?n.refDistance:c.refDistance,rolloffFactor:typeof n.rolloffFactor<"u"?n.rolloffFactor:c.rolloffFactor,panningModel:typeof n.panningModel<"u"?n.panningModel:c.panningModel};var h=s._panner;h||(s._pos||(s._pos=e._pos||[0,0,-.5]),r(s,"spatial"),h=s._panner),h.coneInnerAngle=c.coneInnerAngle,h.coneOuterAngle=c.coneOuterAngle,h.coneOuterGain=c.coneOuterGain,h.distanceModel=c.distanceModel,h.maxDistance=c.maxDistance,h.refDistance=c.refDistance,h.rolloffFactor=c.rolloffFactor,h.panningModel=c.panningModel}return e},Sound.prototype.init=(function(e){return function(){var t=this,n=t._parent;t._orientation=n._orientation,t._stereo=n._stereo,t._pos=n._pos,t._pannerAttr=n._pannerAttr,e.call(this),t._stereo?n.stereo(t._stereo):t._pos&&n.pos(t._pos[0],t._pos[1],t._pos[2],t._id)}})(Sound.prototype.init),Sound.prototype.reset=(function(e){return function(){var t=this,n=t._parent;return t._orientation=n._orientation,t._stereo=n._stereo,t._pos=n._pos,t._pannerAttr=n._pannerAttr,t._stereo?n.stereo(t._stereo):t._pos?n.pos(t._pos[0],t._pos[1],t._pos[2],t._id):t._panner&&(t._panner.disconnect(0),t._panner=void 0,n._refreshBuffer(t)),e.call(this)}})(Sound.prototype.reset);var r=function(e,t){t=t||"spatial",t==="spatial"?(e._panner=Howler.ctx.createPanner(),e._panner.coneInnerAngle=e._pannerAttr.coneInnerAngle,e._panner.coneOuterAngle=e._pannerAttr.coneOuterAngle,e._panner.coneOuterGain=e._pannerAttr.coneOuterGain,e._panner.distanceModel=e._pannerAttr.distanceModel,e._panner.maxDistance=e._pannerAttr.maxDistance,e._panner.refDistance=e._pannerAttr.refDistance,e._panner.rolloffFactor=e._pannerAttr.rolloffFactor,e._panner.panningModel=e._pannerAttr.panningModel,typeof e._panner.positionX<"u"?(e._panner.positionX.setValueAtTime(e._pos[0],Howler.ctx.currentTime),e._panner.positionY.setValueAtTime(e._pos[1],Howler.ctx.currentTime),e._panner.positionZ.setValueAtTime(e._pos[2],Howler.ctx.currentTime)):e._panner.setPosition(e._pos[0],e._pos[1],e._pos[2]),typeof e._panner.orientationX<"u"?(e._panner.orientationX.setValueAtTime(e._orientation[0],Howler.ctx.currentTime),e._panner.orientationY.setValueAtTime(e._orientation[1],Howler.ctx.currentTime),e._panner.orientationZ.setValueAtTime(e._orientation[2],Howler.ctx.currentTime)):e._panner.setOrientation(e._orientation[0],e._orientation[1],e._orientation[2])):(e._panner=Howler.ctx.createStereoPanner(),e._panner.pan.setValueAtTime(e._stereo,Howler.ctx.currentTime)),e._panner.connect(e._node),e._paused||e._parent.pause(e._id,!0).play(e._id,!0)}})()});var vh="oy-skift-v1",yh=["dash","pulse","shield"];function ml(r="normal",e=null){["normal","assist"].includes(e?.difficulty)&&(r=e.difficulty);let t=r==="assist"?8:5;return{difficulty:r==="assist"?"assist":"normal",sector:e?.sector??0,hp:t,maxHp:t,score:e?.score??0,time:e?.time??0,sectorTime:0,hits:0,kills:0,scrap:0,combo:0,comboTime:0,dashCooldown:0,pulseCooldown:0,dashing:0,invulnerable:1.2,cells:new Set,upgrades:[...e?.upgrades??[]],bossDefeated:!1,dead:!1,won:!1,ended:!1}}function bh(r,e){if(!(!Number.isFinite(e)||e<=0||r.dead||r.won||r.ended)){r.time+=e,r.sectorTime+=e;for(let t of["dashCooldown","pulseCooldown","dashing","invulnerable","comboTime"])r[t]=Math.max(0,r[t]-e);r.comboTime||(r.combo=0)}}var gl=r=>r.upgrades.includes("dash")?.65:1.05,xl=r=>r.upgrades.includes("pulse")?1.8:2.7;function wh(r){return r.dead||r.won||r.ended||r.dashCooldown>0?!1:(r.dashing=.19,r.dashCooldown=gl(r),r.invulnerable=Math.max(r.invulnerable,.28),!0)}function Mh(r){return r.dead||r.won||r.ended||r.pulseCooldown>0?!1:(r.pulseCooldown=xl(r),!0)}function Sh(r,e=1){return r.dead||r.won||r.ended||r.invulnerable>0||r.dashing>0?!1:(r.hp=Math.max(0,r.hp-Math.max(0,e)),r.hits++,r.combo=0,r.comboTime=0,r.invulnerable=r.difficulty==="assist"?1.65:1.15,r.dead=r.hp===0,!0)}function wi(r,e,t=!0){r.dead||r.won||r.ended||(t&&(r.combo=Math.min(8,r.combo+1),r.comboTime=4.5),r.score+=Math.round(Math.max(0,e)*(1+Math.max(0,r.combo-1)*.2)))}function Ah(r,e){return r.cells.has(e)||r.dead||r.ended?!1:(r.cells.add(e),wi(r,350),r.hp=Math.min(r.maxHp,r.hp+1),!0)}function Th(r){return r.dead||r.ended||r.cells.size<3||r.sector===2&&!r.bossDefeated?!1:(wi(r,1e3+Math.max(0,Math.round(150-r.sectorTime))*10+(r.hits===0?800:0),!1),r.ended=!0,r.sector===2&&(r.won=!0),!0)}function Eh(r,e){return!yh.includes(e)||r.upgrades.includes(e)?!1:(r.upgrades.push(e),e==="shield"&&(r.maxHp+=2,r.hp=r.maxHp),!0)}function Ch(r){return!r.ended||r.won||r.sector>=2?!1:(r.sector++,r.hp=r.maxHp,r.sectorTime=0,r.hits=0,r.cells.clear(),r.ended=!1,r.dashCooldown=0,r.pulseCooldown=0,r.dashing=0,r.invulnerable=1.2,r.combo=0,!0)}var Us=(r,e,t,n=0)=>Number.isFinite(r)?Math.min(t,Math.max(e,r)):n;function Yi(r,e=!1){let t={version:1,unlocked:0,best:0,wins:0,checkpoint:null,settings:{language:"sv",sound:!0,music:!0,quality:e?"eco":"smooth",qualityChosen:!1,motion:!0,difficulty:"normal"}};if(!r||typeof r!="object"||Array.isArray(r)||r.version!==1)return t;t.unlocked=Math.floor(Us(r.unlocked,0,2)),t.best=Math.floor(Us(r.best,0,1e8)),t.wins=Math.floor(Us(r.wins,0,1e6));let n=r.checkpoint;n&&Number.isInteger(n.sector)&&n.sector>=0&&n.sector<=2&&n.sector<=t.unlocked&&(t.checkpoint={difficulty:["normal","assist"].includes(n.difficulty)?n.difficulty:r.settings?.difficulty==="assist"?"assist":"normal",sector:n.sector,score:Math.floor(Us(n.score,0,1e8)),time:Us(n.time,0,1e7),upgrades:[...new Set(Array.isArray(n.upgrades)?n.upgrades.filter(s=>yh.includes(s)):[])].slice(0,2)});let i=r.settings;if(i&&typeof i=="object"){["sv","en"].includes(i.language)&&(t.settings.language=i.language),i.qualityChosen===!0&&["eco","smooth"].includes(i.quality)&&(t.settings.quality=i.quality,t.settings.qualityChosen=!0),["normal","assist"].includes(i.difficulty)&&(t.settings.difficulty=i.difficulty);for(let s of["sound","music","motion"])typeof i[s]=="boolean"&&(t.settings[s]=i[s])}return t}function Rh(r,e=!1){try{return Yi(JSON.parse(r.getItem(vh)),e)}catch{return Yi(null,e)}}function Ih(r,e){try{return r.setItem(vh,JSON.stringify(Yi(e))),!0}catch{return!1}}var Hr=r=>r>=18e3?"S":r>=13e3?"A":r>=8500?"B":"C",_l=r=>`${Math.floor(r/60).toString().padStart(2,"0")}:${Math.floor(r%60).toString().padStart(2,"0")}`;var eu=0,Jl=1,tu=2;var Ql=1,Go=2,Pn=3,Wn=0,Gt=1,Ut=2,$n=0,Ci=1,ec=2,tc=3,nc=4,nu=5,ci=100,iu=101,su=102,ru=103,ou=104,au=200,lu=201,cu=202,hu=203,ho=204,uo=205,uu=206,du=207,fu=208,pu=209,mu=210,gu=211,xu=212,_u=213,vu=214,Wo=0,qo=1,Xo=2,Ri=3,Yo=4,$o=5,Zo=6,jo=7,ic=0,yu=1,bu=2,Zn=0,wu=1,Mu=2,Su=3,Ko=4,Au=5,Tu=6,Eu=7;var sc=300,Bi=301,Ui=302,Jo=303,Qo=304,vr=306,fo=1e3,li=1001,po=1002,Yt=1003,Cu=1004;var yr=1005;var _n=1006,ea=1007;var pi=1008;var wn=1009,rc=1010,oc=1011,_s=1012,ta=1013,mi=1014,Mn=1015,vs=1016,na=1017,ia=1018,ys=1020,ac=35902,lc=35899,cc=1021,hc=1022,cn=1023,cs=1026,bs=1027,sa=1028,ra=1029,uc=1030,oa=1031;var aa=1033,br=33776,wr=33777,Mr=33778,Sr=33779,la=35840,ca=35841,ha=35842,ua=35843,da=36196,fa=37492,pa=37496,ma=37808,ga=37809,xa=37810,_a=37811,va=37812,ya=37813,ba=37814,wa=37815,Ma=37816,Sa=37817,Aa=37818,Ta=37819,Ea=37820,Ca=37821,Ra=36492,Ia=36494,Pa=36495,La=36283,Na=36284,Da=36285,Fa=36286;var $s=2300,mo=2301,co=2302,Wl=2400,ql=2401,Xl=2402;var Ru=3200,Iu=3201;var dc=0,Pu=1,jn="",Rt="srgb",Ii="srgb-linear",Zs="linear",tt="srgb";var Ei=7680;var Yl=519,Lu=512,Nu=513,Du=514,fc=515,Fu=516,Bu=517,Uu=518,zu=519,$l=35044,pc=35048;var mc="300 es",xn=2e3,js=2001;var qn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let i=n[e];if(i!==void 0){let s=i.indexOf(t);s!==-1&&i.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,e);e.target=null}}},Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ph=1234567,Ws=Math.PI/180,hs=180/Math.PI;function ws(){let r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Nt[r&255]+Nt[r>>8&255]+Nt[r>>16&255]+Nt[r>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]).toLowerCase()}function We(r,e,t){return Math.max(e,Math.min(t,r))}function gc(r,e){return(r%e+e)%e}function wf(r,e,t,n,i){return n+(r-e)*(i-n)/(t-e)}function Mf(r,e,t){return r!==e?(t-r)/(e-r):0}function qs(r,e,t){return(1-t)*r+t*e}function Sf(r,e,t,n){return qs(r,e,1-Math.exp(-t*n))}function Af(r,e=1){return e-Math.abs(gc(r,e*2)-e)}function Tf(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*(3-2*r))}function Ef(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*r*(r*(r*6-15)+10))}function Cf(r,e){return r+Math.floor(Math.random()*(e-r+1))}function Rf(r,e){return r+Math.random()*(e-r)}function If(r){return r*(.5-Math.random())}function Pf(r){r!==void 0&&(Ph=r);let e=Ph+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Lf(r){return r*Ws}function Nf(r){return r*hs}function Df(r){return(r&r-1)===0&&r!==0}function Ff(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Bf(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Uf(r,e,t,n,i){let s=Math.cos,o=Math.sin,l=s(t/2),c=o(t/2),h=s((e+n)/2),a=o((e+n)/2),u=s((e-n)/2),d=o((e-n)/2),f=s((n-e)/2),m=o((n-e)/2);switch(i){case"XYX":r.set(l*a,c*u,c*d,l*h);break;case"YZY":r.set(c*d,l*a,c*u,l*h);break;case"ZXZ":r.set(c*u,c*d,l*a,l*h);break;case"XZX":r.set(l*a,c*m,c*f,l*h);break;case"YXY":r.set(c*f,l*a,c*m,l*h);break;case"ZYZ":r.set(c*m,c*f,l*a,l*h);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function as(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function kt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}var xc={DEG2RAD:Ws,RAD2DEG:hs,generateUUID:ws,clamp:We,euclideanModulo:gc,mapLinear:wf,inverseLerp:Mf,lerp:qs,damp:Sf,pingpong:Af,smoothstep:Tf,smootherstep:Ef,randInt:Cf,randFloat:Rf,randFloatSpread:If,seededRandom:Pf,degToRad:Lf,radToDeg:Nf,isPowerOfTwo:Df,ceilPowerOfTwo:Ff,floorPowerOfTwo:Bf,setQuaternionFromProperEuler:Uf,normalize:kt,denormalize:as},Ee=class r{constructor(e=0,t=0){r.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*n-o*i+e.x,this.y=s*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Xn=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,s,o,l){let c=n[i+0],h=n[i+1],a=n[i+2],u=n[i+3],d=s[o+0],f=s[o+1],m=s[o+2],x=s[o+3];if(l===0){e[t+0]=c,e[t+1]=h,e[t+2]=a,e[t+3]=u;return}if(l===1){e[t+0]=d,e[t+1]=f,e[t+2]=m,e[t+3]=x;return}if(u!==x||c!==d||h!==f||a!==m){let p=1-l,g=c*d+h*f+a*m+u*x,_=g>=0?1:-1,y=1-g*g;if(y>Number.EPSILON){let T=Math.sqrt(y),A=Math.atan2(T,g*_);p=Math.sin(p*A)/T,l=Math.sin(l*A)/T}let v=l*_;if(c=c*p+d*v,h=h*p+f*v,a=a*p+m*v,u=u*p+x*v,p===1-l){let T=1/Math.sqrt(c*c+h*h+a*a+u*u);c*=T,h*=T,a*=T,u*=T}}e[t]=c,e[t+1]=h,e[t+2]=a,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,s,o){let l=n[i],c=n[i+1],h=n[i+2],a=n[i+3],u=s[o],d=s[o+1],f=s[o+2],m=s[o+3];return e[t]=l*m+a*u+c*f-h*d,e[t+1]=c*m+a*d+h*u-l*f,e[t+2]=h*m+a*f+l*d-c*u,e[t+3]=a*m-l*u-c*d-h*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,s=e._z,o=e._order,l=Math.cos,c=Math.sin,h=l(n/2),a=l(i/2),u=l(s/2),d=c(n/2),f=c(i/2),m=c(s/2);switch(o){case"XYZ":this._x=d*a*u+h*f*m,this._y=h*f*u-d*a*m,this._z=h*a*m+d*f*u,this._w=h*a*u-d*f*m;break;case"YXZ":this._x=d*a*u+h*f*m,this._y=h*f*u-d*a*m,this._z=h*a*m-d*f*u,this._w=h*a*u+d*f*m;break;case"ZXY":this._x=d*a*u-h*f*m,this._y=h*f*u+d*a*m,this._z=h*a*m+d*f*u,this._w=h*a*u-d*f*m;break;case"ZYX":this._x=d*a*u-h*f*m,this._y=h*f*u+d*a*m,this._z=h*a*m-d*f*u,this._w=h*a*u+d*f*m;break;case"YZX":this._x=d*a*u+h*f*m,this._y=h*f*u+d*a*m,this._z=h*a*m-d*f*u,this._w=h*a*u-d*f*m;break;case"XZY":this._x=d*a*u-h*f*m,this._y=h*f*u-d*a*m,this._z=h*a*m+d*f*u,this._w=h*a*u+d*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],s=t[8],o=t[1],l=t[5],c=t[9],h=t[2],a=t[6],u=t[10],d=n+l+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(a-c)*f,this._y=(s-h)*f,this._z=(o-i)*f}else if(n>l&&n>u){let f=2*Math.sqrt(1+n-l-u);this._w=(a-c)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(s+h)/f}else if(l>u){let f=2*Math.sqrt(1+l-n-u);this._w=(s-h)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(c+a)/f}else{let f=2*Math.sqrt(1+u-n-l);this._w=(o-i)/f,this._x=(s+h)/f,this._y=(c+a)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,s=e._z,o=e._w,l=t._x,c=t._y,h=t._z,a=t._w;return this._x=n*a+o*l+i*h-s*c,this._y=i*a+o*c+s*l-n*h,this._z=s*a+o*h+n*c-i*l,this._w=o*a-n*l-i*c-s*h,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,s=this._z,o=this._w,l=o*e._w+n*e._x+i*e._y+s*e._z;if(l<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,l=-l):this.copy(e),l>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;let c=1-l*l;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*s+t*this._z,this.normalize(),this}let h=Math.sqrt(c),a=Math.atan2(h,l),u=Math.sin((1-t)*a)/h,d=Math.sin(t*a)/h;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},F=class r{constructor(e=0,t=0,n=0){r.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Lh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Lh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*i,this.y=s[1]*t+s[4]*n+s[7]*i,this.z=s[2]*t+s[5]*n+s[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=e.elements,o=1/(s[3]*t+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*t+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*t+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,s=e.x,o=e.y,l=e.z,c=e.w,h=2*(o*i-l*n),a=2*(l*t-s*i),u=2*(s*n-o*t);return this.x=t+c*h+o*u-l*a,this.y=n+c*a+l*h-s*u,this.z=i+c*u+s*a-o*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i,this.y=s[1]*t+s[5]*n+s[9]*i,this.z=s[2]*t+s[6]*n+s[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,s=e.z,o=t.x,l=t.y,c=t.z;return this.x=i*c-s*l,this.y=s*o-n*c,this.z=n*l-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return vl.copy(this).projectOnVector(e),this.sub(vl)}reflect(e){return this.sub(vl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},vl=new F,Lh=new Xn,ze=class r{constructor(e,t,n,i,s,o,l,c,h){r.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,o,l,c,h)}set(e,t,n,i,s,o,l,c,h){let a=this.elements;return a[0]=e,a[1]=i,a[2]=l,a[3]=t,a[4]=s,a[5]=c,a[6]=n,a[7]=o,a[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,o=n[0],l=n[3],c=n[6],h=n[1],a=n[4],u=n[7],d=n[2],f=n[5],m=n[8],x=i[0],p=i[3],g=i[6],_=i[1],y=i[4],v=i[7],T=i[2],A=i[5],C=i[8];return s[0]=o*x+l*_+c*T,s[3]=o*p+l*y+c*A,s[6]=o*g+l*v+c*C,s[1]=h*x+a*_+u*T,s[4]=h*p+a*y+u*A,s[7]=h*g+a*v+u*C,s[2]=d*x+f*_+m*T,s[5]=d*p+f*y+m*A,s[8]=d*g+f*v+m*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],l=e[5],c=e[6],h=e[7],a=e[8];return t*o*a-t*l*h-n*s*a+n*l*c+i*s*h-i*o*c}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],l=e[5],c=e[6],h=e[7],a=e[8],u=a*o-l*h,d=l*c-a*s,f=h*s-o*c,m=t*u+n*d+i*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return e[0]=u*x,e[1]=(i*h-a*n)*x,e[2]=(l*n-i*o)*x,e[3]=d*x,e[4]=(a*t-i*c)*x,e[5]=(i*s-l*t)*x,e[6]=f*x,e[7]=(n*c-h*t)*x,e[8]=(o*t-n*s)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,s,o,l){let c=Math.cos(s),h=Math.sin(s);return this.set(n*c,n*h,-n*(c*o+h*l)+o+e,-i*h,i*c,-i*(-h*o+c*l)+l+t,0,0,1),this}scale(e,t){return this.premultiply(yl.makeScale(e,t)),this}rotate(e){return this.premultiply(yl.makeRotation(-e)),this}translate(e,t){return this.premultiply(yl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},yl=new ze;function _c(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Ks(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Ou(){let r=Ks("canvas");return r.style.display="block",r}var Nh={};function us(r){r in Nh||(Nh[r]=!0,console.warn(r))}function ku(r,e,t){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}var Dh=new ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Fh=new ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function zf(){let r={enabled:!0,workingColorSpace:Ii,spaces:{},convert:function(i,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===tt&&(i.r=Gn(i.r),i.g=Gn(i.g),i.b=Gn(i.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===tt&&(i.r=ls(i.r),i.g=ls(i.g),i.b=ls(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===jn?Zs:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,o){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return us("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return us("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(i,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return r.define({[Ii]:{primaries:e,whitePoint:n,transfer:Zs,toXYZ:Dh,fromXYZ:Fh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Rt},outputColorSpaceConfig:{drawingBufferColorSpace:Rt}},[Rt]:{primaries:e,whitePoint:n,transfer:tt,toXYZ:Dh,fromXYZ:Fh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Rt}}}),r}var je=zf();function Gn(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function ls(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}var $i,go=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{$i===void 0&&($i=Ks("canvas")),$i.width=e.width,$i.height=e.height;let i=$i.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=$i}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ks("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=Gn(s[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Gn(t[n]/255)*255):t[n]=Gn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Of=0,ds=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Of++}),this.uuid=ws(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,l=i.length;o<l;o++)i[o].isDataTexture?s.push(bl(i[o].image)):s.push(bl(i[o]))}else s=bl(i);n.url=s}return t||(e.images[this.uuid]=n),n}};function bl(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?go.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var kf=0,wl=new F,Vt=class r extends qn{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,n=li,i=li,s=_n,o=pi,l=cn,c=wn,h=r.DEFAULT_ANISOTROPY,a=jn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kf++}),this.uuid=ws(),this.name="",this.source=new ds(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=h,this.format=l,this.internalFormat=null,this.type=c,this.offset=new Ee(0,0),this.repeat=new Ee(1,1),this.center=new Ee(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=a,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(wl).x}get height(){return this.source.getSize(wl).y}get depth(){return this.source.getSize(wl).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==sc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case fo:e.x=e.x-Math.floor(e.x);break;case li:e.x=e.x<0?0:1;break;case po:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case fo:e.y=e.y-Math.floor(e.y);break;case li:e.y=e.y<0?0:1;break;case po:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Vt.DEFAULT_IMAGE=null;Vt.DEFAULT_MAPPING=sc;Vt.DEFAULT_ANISOTROPY=1;var xt=class r{constructor(e=0,t=0,n=0,i=1){r.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,s,c=e.elements,h=c[0],a=c[4],u=c[8],d=c[1],f=c[5],m=c[9],x=c[2],p=c[6],g=c[10];if(Math.abs(a-d)<.01&&Math.abs(u-x)<.01&&Math.abs(m-p)<.01){if(Math.abs(a+d)<.1&&Math.abs(u+x)<.1&&Math.abs(m+p)<.1&&Math.abs(h+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let y=(h+1)/2,v=(f+1)/2,T=(g+1)/2,A=(a+d)/4,C=(u+x)/4,R=(m+p)/4;return y>v&&y>T?y<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(y),i=A/n,s=C/n):v>T?v<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(v),n=A/i,s=R/i):T<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(T),n=C/s,i=R/s),this.set(n,i,s,t),this}let _=Math.sqrt((p-m)*(p-m)+(u-x)*(u-x)+(d-a)*(d-a));return Math.abs(_)<.001&&(_=1),this.x=(p-m)/_,this.y=(u-x)/_,this.z=(d-a)/_,this.w=Math.acos((h+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},xo=class extends qn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:_n,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t);let i={width:e,height:t,depth:n.depth},s=new Vt(i);this.textures=[];let o=n.count;for(let l=0;l<o;l++)this.textures[l]=s.clone(),this.textures[l].isRenderTargetTexture=!0,this.textures[l].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){let t={minFilter:_n,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let i=Object.assign({},e.textures[t].image);this.textures[t].source=new ds(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Rn=class extends xo{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Js=class extends Vt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Yt,this.minFilter=Yt,this.wrapR=li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var _o=class extends Vt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Yt,this.minFilter=Yt,this.wrapR=li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var In=class{constructor(e=new F(1/0,1/0,1/0),t=new F(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(pn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(pn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=pn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,l=s.count;o<l;o++)e.isMesh===!0?e.getVertexPosition(o,pn):pn.fromBufferAttribute(s,o),pn.applyMatrix4(e.matrixWorld),this.expandByPoint(pn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Gr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Gr.copy(n.boundingBox)),Gr.applyMatrix4(e.matrixWorld),this.union(Gr)}let i=e.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,pn),pn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(zs),Wr.subVectors(this.max,zs),Zi.subVectors(e.a,zs),ji.subVectors(e.b,zs),Ki.subVectors(e.c,zs),ti.subVectors(ji,Zi),ni.subVectors(Ki,ji),Mi.subVectors(Zi,Ki);let t=[0,-ti.z,ti.y,0,-ni.z,ni.y,0,-Mi.z,Mi.y,ti.z,0,-ti.x,ni.z,0,-ni.x,Mi.z,0,-Mi.x,-ti.y,ti.x,0,-ni.y,ni.x,0,-Mi.y,Mi.x,0];return!Ml(t,Zi,ji,Ki,Wr)||(t=[1,0,0,0,1,0,0,0,1],!Ml(t,Zi,ji,Ki,Wr))?!1:(qr.crossVectors(ti,ni),t=[qr.x,qr.y,qr.z],Ml(t,Zi,ji,Ki,Wr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,pn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(pn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(zn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),zn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),zn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),zn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),zn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),zn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),zn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),zn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(zn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},zn=[new F,new F,new F,new F,new F,new F,new F,new F],pn=new F,Gr=new In,Zi=new F,ji=new F,Ki=new F,ti=new F,ni=new F,Mi=new F,zs=new F,Wr=new F,qr=new F,Si=new F;function Ml(r,e,t,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){Si.fromArray(r,s);let l=i.x*Math.abs(Si.x)+i.y*Math.abs(Si.y)+i.z*Math.abs(Si.z),c=e.dot(Si),h=t.dot(Si),a=n.dot(Si);if(Math.max(-Math.max(c,h,a),Math.min(c,h,a))>l)return!1}return!0}var Vf=new In,Os=new F,Sl=new F,hi=class{constructor(e=new F,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Vf.setFromPoints(e).getCenter(n);let i=0;for(let s=0,o=e.length;s<o;s++)i=Math.max(i,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Os.subVectors(e,this.center);let t=Os.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Os,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Sl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Os.copy(e.center).add(Sl)),this.expandByPoint(Os.copy(e.center).sub(Sl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},On=new F,Al=new F,Xr=new F,ii=new F,Tl=new F,Yr=new F,El=new F,vo=class{constructor(e=new F,t=new F(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,On)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=On.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(On.copy(this.origin).addScaledVector(this.direction,t),On.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Al.copy(e).add(t).multiplyScalar(.5),Xr.copy(t).sub(e).normalize(),ii.copy(this.origin).sub(Al);let s=e.distanceTo(t)*.5,o=-this.direction.dot(Xr),l=ii.dot(this.direction),c=-ii.dot(Xr),h=ii.lengthSq(),a=Math.abs(1-o*o),u,d,f,m;if(a>0)if(u=o*c-l,d=o*l-c,m=s*a,u>=0)if(d>=-m)if(d<=m){let x=1/a;u*=x,d*=x,f=u*(u+o*d+2*l)+d*(o*u+d+2*c)+h}else d=s,u=Math.max(0,-(o*d+l)),f=-u*u+d*(d+2*c)+h;else d=-s,u=Math.max(0,-(o*d+l)),f=-u*u+d*(d+2*c)+h;else d<=-m?(u=Math.max(0,-(-o*s+l)),d=u>0?-s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+h):d<=m?(u=0,d=Math.min(Math.max(-s,-c),s),f=d*(d+2*c)+h):(u=Math.max(0,-(o*s+l)),d=u>0?s:Math.min(Math.max(-s,-c),s),f=-u*u+d*(d+2*c)+h);else d=o>0?-s:s,u=Math.max(0,-(o*d+l)),f=-u*u+d*(d+2*c)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Al).addScaledVector(Xr,d),f}intersectSphere(e,t){On.subVectors(e.center,this.origin);let n=On.dot(this.direction),i=On.dot(On)-n*n,s=e.radius*e.radius;if(i>s)return null;let o=Math.sqrt(s-i),l=n-o,c=n+o;return c<0?null:l<0?this.at(c,t):this.at(l,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,s,o,l,c,h=1/this.direction.x,a=1/this.direction.y,u=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,i=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,i=(e.min.x-d.x)*h),a>=0?(s=(e.min.y-d.y)*a,o=(e.max.y-d.y)*a):(s=(e.max.y-d.y)*a,o=(e.min.y-d.y)*a),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),u>=0?(l=(e.min.z-d.z)*u,c=(e.max.z-d.z)*u):(l=(e.max.z-d.z)*u,c=(e.min.z-d.z)*u),n>c||l>i)||((l>n||n!==n)&&(n=l),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,On)!==null}intersectTriangle(e,t,n,i,s){Tl.subVectors(t,e),Yr.subVectors(n,e),El.crossVectors(Tl,Yr);let o=this.direction.dot(El),l;if(o>0){if(i)return null;l=1}else if(o<0)l=-1,o=-o;else return null;ii.subVectors(this.origin,e);let c=l*this.direction.dot(Yr.crossVectors(ii,Yr));if(c<0)return null;let h=l*this.direction.dot(Tl.cross(ii));if(h<0||c+h>o)return null;let a=-l*ii.dot(El);return a<0?null:this.at(a/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},rt=class r{constructor(e,t,n,i,s,o,l,c,h,a,u,d,f,m,x,p){r.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,o,l,c,h,a,u,d,f,m,x,p)}set(e,t,n,i,s,o,l,c,h,a,u,d,f,m,x,p){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=i,g[1]=s,g[5]=o,g[9]=l,g[13]=c,g[2]=h,g[6]=a,g[10]=u,g[14]=d,g[3]=f,g[7]=m,g[11]=x,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new r().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/Ji.setFromMatrixColumn(e,0).length(),s=1/Ji.setFromMatrixColumn(e,1).length(),o=1/Ji.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,s=e.z,o=Math.cos(n),l=Math.sin(n),c=Math.cos(i),h=Math.sin(i),a=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let d=o*a,f=o*u,m=l*a,x=l*u;t[0]=c*a,t[4]=-c*u,t[8]=h,t[1]=f+m*h,t[5]=d-x*h,t[9]=-l*c,t[2]=x-d*h,t[6]=m+f*h,t[10]=o*c}else if(e.order==="YXZ"){let d=c*a,f=c*u,m=h*a,x=h*u;t[0]=d+x*l,t[4]=m*l-f,t[8]=o*h,t[1]=o*u,t[5]=o*a,t[9]=-l,t[2]=f*l-m,t[6]=x+d*l,t[10]=o*c}else if(e.order==="ZXY"){let d=c*a,f=c*u,m=h*a,x=h*u;t[0]=d-x*l,t[4]=-o*u,t[8]=m+f*l,t[1]=f+m*l,t[5]=o*a,t[9]=x-d*l,t[2]=-o*h,t[6]=l,t[10]=o*c}else if(e.order==="ZYX"){let d=o*a,f=o*u,m=l*a,x=l*u;t[0]=c*a,t[4]=m*h-f,t[8]=d*h+x,t[1]=c*u,t[5]=x*h+d,t[9]=f*h-m,t[2]=-h,t[6]=l*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*h,m=l*c,x=l*h;t[0]=c*a,t[4]=x-d*u,t[8]=m*u+f,t[1]=u,t[5]=o*a,t[9]=-l*a,t[2]=-h*a,t[6]=f*u+m,t[10]=d-x*u}else if(e.order==="XZY"){let d=o*c,f=o*h,m=l*c,x=l*h;t[0]=c*a,t[4]=-u,t[8]=h*a,t[1]=d*u+x,t[5]=o*a,t[9]=f*u-m,t[2]=m*u-f,t[6]=l*a,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Hf,e,Gf)}lookAt(e,t,n){let i=this.elements;return Qt.subVectors(e,t),Qt.lengthSq()===0&&(Qt.z=1),Qt.normalize(),si.crossVectors(n,Qt),si.lengthSq()===0&&(Math.abs(n.z)===1?Qt.x+=1e-4:Qt.z+=1e-4,Qt.normalize(),si.crossVectors(n,Qt)),si.normalize(),$r.crossVectors(Qt,si),i[0]=si.x,i[4]=$r.x,i[8]=Qt.x,i[1]=si.y,i[5]=$r.y,i[9]=Qt.y,i[2]=si.z,i[6]=$r.z,i[10]=Qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,o=n[0],l=n[4],c=n[8],h=n[12],a=n[1],u=n[5],d=n[9],f=n[13],m=n[2],x=n[6],p=n[10],g=n[14],_=n[3],y=n[7],v=n[11],T=n[15],A=i[0],C=i[4],R=i[8],M=i[12],b=i[1],P=i[5],B=i[9],L=i[13],U=i[2],O=i[6],D=i[10],j=i[14],H=i[3],Z=i[7],ae=i[11],de=i[15];return s[0]=o*A+l*b+c*U+h*H,s[4]=o*C+l*P+c*O+h*Z,s[8]=o*R+l*B+c*D+h*ae,s[12]=o*M+l*L+c*j+h*de,s[1]=a*A+u*b+d*U+f*H,s[5]=a*C+u*P+d*O+f*Z,s[9]=a*R+u*B+d*D+f*ae,s[13]=a*M+u*L+d*j+f*de,s[2]=m*A+x*b+p*U+g*H,s[6]=m*C+x*P+p*O+g*Z,s[10]=m*R+x*B+p*D+g*ae,s[14]=m*M+x*L+p*j+g*de,s[3]=_*A+y*b+v*U+T*H,s[7]=_*C+y*P+v*O+T*Z,s[11]=_*R+y*B+v*D+T*ae,s[15]=_*M+y*L+v*j+T*de,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],s=e[12],o=e[1],l=e[5],c=e[9],h=e[13],a=e[2],u=e[6],d=e[10],f=e[14],m=e[3],x=e[7],p=e[11],g=e[15];return m*(+s*c*u-i*h*u-s*l*d+n*h*d+i*l*f-n*c*f)+x*(+t*c*f-t*h*d+s*o*d-i*o*f+i*h*a-s*c*a)+p*(+t*h*u-t*l*f-s*o*u+n*o*f+s*l*a-n*h*a)+g*(-i*l*a-t*c*u+t*l*d+i*o*u-n*o*d+n*c*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],l=e[5],c=e[6],h=e[7],a=e[8],u=e[9],d=e[10],f=e[11],m=e[12],x=e[13],p=e[14],g=e[15],_=u*p*h-x*d*h+x*c*f-l*p*f-u*c*g+l*d*g,y=m*d*h-a*p*h-m*c*f+o*p*f+a*c*g-o*d*g,v=a*x*h-m*u*h+m*l*f-o*x*f-a*l*g+o*u*g,T=m*u*c-a*x*c-m*l*d+o*x*d+a*l*p-o*u*p,A=t*_+n*y+i*v+s*T;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/A;return e[0]=_*C,e[1]=(x*d*s-u*p*s-x*i*f+n*p*f+u*i*g-n*d*g)*C,e[2]=(l*p*s-x*c*s+x*i*h-n*p*h-l*i*g+n*c*g)*C,e[3]=(u*c*s-l*d*s-u*i*h+n*d*h+l*i*f-n*c*f)*C,e[4]=y*C,e[5]=(a*p*s-m*d*s+m*i*f-t*p*f-a*i*g+t*d*g)*C,e[6]=(m*c*s-o*p*s-m*i*h+t*p*h+o*i*g-t*c*g)*C,e[7]=(o*d*s-a*c*s+a*i*h-t*d*h-o*i*f+t*c*f)*C,e[8]=v*C,e[9]=(m*u*s-a*x*s-m*n*f+t*x*f+a*n*g-t*u*g)*C,e[10]=(o*x*s-m*l*s+m*n*h-t*x*h-o*n*g+t*l*g)*C,e[11]=(a*l*s-o*u*s-a*n*h+t*u*h+o*n*f-t*l*f)*C,e[12]=T*C,e[13]=(a*x*i-m*u*i+m*n*d-t*x*d-a*n*p+t*u*p)*C,e[14]=(m*l*i-o*x*i-m*n*c+t*x*c+o*n*p-t*l*p)*C,e[15]=(o*u*i-a*l*i+a*n*c-t*u*c-o*n*d+t*l*d)*C,this}scale(e){let t=this.elements,n=e.x,i=e.y,s=e.z;return t[0]*=n,t[4]*=i,t[8]*=s,t[1]*=n,t[5]*=i,t[9]*=s,t[2]*=n,t[6]*=i,t[10]*=s,t[3]*=n,t[7]*=i,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),s=1-n,o=e.x,l=e.y,c=e.z,h=s*o,a=s*l;return this.set(h*o+n,h*l-i*c,h*c+i*l,0,h*l+i*c,a*l+n,a*c-i*o,0,h*c-i*l,a*c+i*o,s*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,s,o){return this.set(1,n,s,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,s=t._x,o=t._y,l=t._z,c=t._w,h=s+s,a=o+o,u=l+l,d=s*h,f=s*a,m=s*u,x=o*a,p=o*u,g=l*u,_=c*h,y=c*a,v=c*u,T=n.x,A=n.y,C=n.z;return i[0]=(1-(x+g))*T,i[1]=(f+v)*T,i[2]=(m-y)*T,i[3]=0,i[4]=(f-v)*A,i[5]=(1-(d+g))*A,i[6]=(p+_)*A,i[7]=0,i[8]=(m+y)*C,i[9]=(p-_)*C,i[10]=(1-(d+x))*C,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,s=Ji.set(i[0],i[1],i[2]).length(),o=Ji.set(i[4],i[5],i[6]).length(),l=Ji.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),e.x=i[12],e.y=i[13],e.z=i[14],mn.copy(this);let h=1/s,a=1/o,u=1/l;return mn.elements[0]*=h,mn.elements[1]*=h,mn.elements[2]*=h,mn.elements[4]*=a,mn.elements[5]*=a,mn.elements[6]*=a,mn.elements[8]*=u,mn.elements[9]*=u,mn.elements[10]*=u,t.setFromRotationMatrix(mn),n.x=s,n.y=o,n.z=l,this}makePerspective(e,t,n,i,s,o,l=xn,c=!1){let h=this.elements,a=2*s/(t-e),u=2*s/(n-i),d=(t+e)/(t-e),f=(n+i)/(n-i),m,x;if(c)m=s/(o-s),x=o*s/(o-s);else if(l===xn)m=-(o+s)/(o-s),x=-2*o*s/(o-s);else if(l===js)m=-o/(o-s),x=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);return h[0]=a,h[4]=0,h[8]=d,h[12]=0,h[1]=0,h[5]=u,h[9]=f,h[13]=0,h[2]=0,h[6]=0,h[10]=m,h[14]=x,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(e,t,n,i,s,o,l=xn,c=!1){let h=this.elements,a=2/(t-e),u=2/(n-i),d=-(t+e)/(t-e),f=-(n+i)/(n-i),m,x;if(c)m=1/(o-s),x=o/(o-s);else if(l===xn)m=-2/(o-s),x=-(o+s)/(o-s);else if(l===js)m=-1/(o-s),x=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);return h[0]=a,h[4]=0,h[8]=0,h[12]=d,h[1]=0,h[5]=u,h[9]=0,h[13]=f,h[2]=0,h[6]=0,h[10]=m,h[14]=x,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ji=new F,mn=new rt,Hf=new F(0,0,0),Gf=new F(1,1,1),si=new F,$r=new F,Qt=new F,Bh=new rt,Uh=new Xn,vn=class r{constructor(e=0,t=0,n=0,i=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,s=i[0],o=i[4],l=i[8],c=i[1],h=i[5],a=i[9],u=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-a,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._y=Math.atan2(l,f),this._z=Math.atan2(c,h)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,h)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-We(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,h));break;case"YZX":this._z=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-a,h),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(l,f));break;case"XZY":this._z=Math.asin(-We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(l,s)):(this._x=Math.atan2(-a,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Bh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Bh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Uh.setFromEuler(this),this.setFromQuaternion(Uh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};vn.DEFAULT_ORDER="XYZ";var Qs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Wf=0,zh=new F,Qi=new Xn,kn=new rt,Zr=new F,ks=new F,qf=new F,Xf=new Xn,Oh=new F(1,0,0),kh=new F(0,1,0),Vh=new F(0,0,1),Hh={type:"added"},Yf={type:"removed"},es={type:"childadded",child:null},Cl={type:"childremoved",child:null},Et=class r extends qn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Wf++}),this.uuid=ws(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new F,t=new vn,n=new Xn,i=new F(1,1,1);function s(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new rt},normalMatrix:{value:new ze}}),this.matrix=new rt,this.matrixWorld=new rt,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Qs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Qi.setFromAxisAngle(e,t),this.quaternion.multiply(Qi),this}rotateOnWorldAxis(e,t){return Qi.setFromAxisAngle(e,t),this.quaternion.premultiply(Qi),this}rotateX(e){return this.rotateOnAxis(Oh,e)}rotateY(e){return this.rotateOnAxis(kh,e)}rotateZ(e){return this.rotateOnAxis(Vh,e)}translateOnAxis(e,t){return zh.copy(e).applyQuaternion(this.quaternion),this.position.add(zh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Oh,e)}translateY(e){return this.translateOnAxis(kh,e)}translateZ(e){return this.translateOnAxis(Vh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(kn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Zr.copy(e):Zr.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?kn.lookAt(ks,Zr,this.up):kn.lookAt(Zr,ks,this.up),this.quaternion.setFromRotationMatrix(kn),i&&(kn.extractRotation(i.matrixWorld),Qi.setFromRotationMatrix(kn),this.quaternion.premultiply(Qi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Hh),es.child=e,this.dispatchEvent(es),es.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Yf),Cl.child=e,this.dispatchEvent(Cl),Cl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),kn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),kn.multiply(e.parent.matrixWorld)),e.applyMatrix4(kn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Hh),es.child=e,this.dispatchEvent(es),es.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,e,qf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ks,Xf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(l=>({...l,boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(l=>({...l})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(l,c){return l[c.uuid]===void 0&&(l[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(e.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let c=l.shapes;if(Array.isArray(c))for(let h=0,a=c.length;h<a;h++){let u=c[h];s(e.shapes,u)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let c=0,h=this.material.length;c<h;c++)l.push(s(e.materials,this.material[c]));i.material=l}else i.material=s(e.materials,this.material);if(this.children.length>0){i.children=[];for(let l=0;l<this.children.length;l++)i.children.push(this.children[l].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let l=0;l<this.animations.length;l++){let c=this.animations[l];i.animations.push(s(e.animations,c))}}if(t){let l=o(e.geometries),c=o(e.materials),h=o(e.textures),a=o(e.images),u=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);l.length>0&&(n.geometries=l),c.length>0&&(n.materials=c),h.length>0&&(n.textures=h),a.length>0&&(n.images=a),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=i,n;function o(l){let c=[];for(let h in l){let a=l[h];delete a.metadata,c.push(a)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};Et.DEFAULT_UP=new F(0,1,0);Et.DEFAULT_MATRIX_AUTO_UPDATE=!0;Et.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var gn=new F,Vn=new F,Rl=new F,Hn=new F,ts=new F,ns=new F,Gh=new F,Il=new F,Pl=new F,Ll=new F,Nl=new xt,Dl=new xt,Fl=new xt,ai=class r{constructor(e=new F,t=new F,n=new F){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),gn.subVectors(e,t),i.cross(gn);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(e,t,n,i,s){gn.subVectors(i,t),Vn.subVectors(n,t),Rl.subVectors(e,t);let o=gn.dot(gn),l=gn.dot(Vn),c=gn.dot(Rl),h=Vn.dot(Vn),a=Vn.dot(Rl),u=o*h-l*l;if(u===0)return s.set(0,0,0),null;let d=1/u,f=(h*c-l*a)*d,m=(o*a-l*c)*d;return s.set(1-f-m,m,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Hn)===null?!1:Hn.x>=0&&Hn.y>=0&&Hn.x+Hn.y<=1}static getInterpolation(e,t,n,i,s,o,l,c){return this.getBarycoord(e,t,n,i,Hn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Hn.x),c.addScaledVector(o,Hn.y),c.addScaledVector(l,Hn.z),c)}static getInterpolatedAttribute(e,t,n,i,s,o){return Nl.setScalar(0),Dl.setScalar(0),Fl.setScalar(0),Nl.fromBufferAttribute(e,t),Dl.fromBufferAttribute(e,n),Fl.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(Nl,s.x),o.addScaledVector(Dl,s.y),o.addScaledVector(Fl,s.z),o}static isFrontFacing(e,t,n,i){return gn.subVectors(n,t),Vn.subVectors(e,t),gn.cross(Vn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return gn.subVectors(this.c,this.b),Vn.subVectors(this.a,this.b),gn.cross(Vn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,s){return r.getInterpolation(e,this.a,this.b,this.c,t,n,i,s)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,s=this.c,o,l;ts.subVectors(i,n),ns.subVectors(s,n),Il.subVectors(e,n);let c=ts.dot(Il),h=ns.dot(Il);if(c<=0&&h<=0)return t.copy(n);Pl.subVectors(e,i);let a=ts.dot(Pl),u=ns.dot(Pl);if(a>=0&&u<=a)return t.copy(i);let d=c*u-a*h;if(d<=0&&c>=0&&a<=0)return o=c/(c-a),t.copy(n).addScaledVector(ts,o);Ll.subVectors(e,s);let f=ts.dot(Ll),m=ns.dot(Ll);if(m>=0&&f<=m)return t.copy(s);let x=f*h-c*m;if(x<=0&&h>=0&&m<=0)return l=h/(h-m),t.copy(n).addScaledVector(ns,l);let p=a*m-f*u;if(p<=0&&u-a>=0&&f-m>=0)return Gh.subVectors(s,i),l=(u-a)/(u-a+(f-m)),t.copy(i).addScaledVector(Gh,l);let g=1/(p+x+d);return o=x*g,l=d*g,t.copy(n).addScaledVector(ts,o).addScaledVector(ns,l)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Vu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ri={h:0,s:0,l:0},jr={h:0,s:0,l:0};function Bl(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}var Ge=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Rt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,je.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=je.workingColorSpace){return this.r=e,this.g=t,this.b=n,je.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=je.workingColorSpace){if(e=gc(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+t):n+t-n*t,o=2*n-s;this.r=Bl(o,s,e+1/3),this.g=Bl(o,s,e),this.b=Bl(o,s,e-1/3)}return je.colorSpaceToWorking(this,i),this}setStyle(e,t=Rt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=i[1],l=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Rt){let n=Vu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gn(e.r),this.g=Gn(e.g),this.b=Gn(e.b),this}copyLinearToSRGB(e){return this.r=ls(e.r),this.g=ls(e.g),this.b=ls(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Rt){return je.workingToColorSpace(Dt.copy(this),e),Math.round(We(Dt.r*255,0,255))*65536+Math.round(We(Dt.g*255,0,255))*256+Math.round(We(Dt.b*255,0,255))}getHexString(e=Rt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=je.workingColorSpace){je.workingToColorSpace(Dt.copy(this),t);let n=Dt.r,i=Dt.g,s=Dt.b,o=Math.max(n,i,s),l=Math.min(n,i,s),c,h,a=(l+o)/2;if(l===o)c=0,h=0;else{let u=o-l;switch(h=a<=.5?u/(o+l):u/(2-o-l),o){case n:c=(i-s)/u+(i<s?6:0);break;case i:c=(s-n)/u+2;break;case s:c=(n-i)/u+4;break}c/=6}return e.h=c,e.s=h,e.l=a,e}getRGB(e,t=je.workingColorSpace){return je.workingToColorSpace(Dt.copy(this),t),e.r=Dt.r,e.g=Dt.g,e.b=Dt.b,e}getStyle(e=Rt){je.workingToColorSpace(Dt.copy(this),e);let t=Dt.r,n=Dt.g,i=Dt.b;return e!==Rt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(ri),this.setHSL(ri.h+e,ri.s+t,ri.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ri),e.getHSL(jr);let n=qs(ri.h,jr.h,t),i=qs(ri.s,jr.s,t),s=qs(ri.l,jr.l,t);return this.setHSL(n,i,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*i,this.g=s[1]*t+s[4]*n+s[7]*i,this.b=s[2]*t+s[5]*n+s[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Dt=new Ge;Ge.NAMES=Vu;var $f=0,ui=class extends qn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$f++}),this.uuid=ws(),this.name="",this.type="Material",this.blending=Ci,this.side=Wn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ho,this.blendDst=uo,this.blendEquation=ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ge(0,0,0),this.blendAlpha=0,this.depthFunc=Ri,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Yl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ei,this.stencilZFail=Ei,this.stencilZPass=Ei,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ci&&(n.blending=this.blending),this.side!==Wn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ho&&(n.blendSrc=this.blendSrc),this.blendDst!==uo&&(n.blendDst=this.blendDst),this.blendEquation!==ci&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ri&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Yl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ei&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ei&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ei&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){let o=[];for(let l in s){let c=s[l];delete c.metadata,o.push(c)}return o}if(t){let s=i(e.textures),o=i(e.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Ht=class extends ui{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ge(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.combine=ic,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var bt=new F,Kr=new Ee,Zf=0,Ft=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Zf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=$l,this.updateRanges=[],this.gpuType=Mn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Kr.fromBufferAttribute(this,t),Kr.applyMatrix3(e),this.setXY(t,Kr.x,Kr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix3(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix4(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.applyNormalMatrix(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)bt.fromBufferAttribute(this,t),bt.transformDirection(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=as(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=kt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=as(t,this.array)),t}setX(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=as(t,this.array)),t}setY(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=as(t,this.array)),t}setZ(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=as(t,this.array)),t}setW(e,t){return this.normalized&&(t=kt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e*=this.itemSize,this.normalized&&(t=kt(t,this.array),n=kt(n,this.array),i=kt(i,this.array),s=kt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==$l&&(e.usage=this.usage),e}};var er=class extends Ft{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var tr=class extends Ft{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var nt=class extends Ft{constructor(e,t,n){super(new Float32Array(e),t,n)}},jf=0,an=new rt,Ul=new Et,is=new F,en=new In,Vs=new In,Tt=new F,Bt=class r extends qn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:jf++}),this.uuid=ws(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(_c(e)?tr:er)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new ze().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,n){return an.makeTranslation(e,t,n),this.applyMatrix4(an),this}scale(e,t,n){return an.makeScale(e,t,n),this.applyMatrix4(an),this}lookAt(e){return Ul.lookAt(e),Ul.updateMatrix(),this.applyMatrix4(Ul.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(is).negate(),this.translate(is.x,is.y,is.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let i=0,s=e.length;i<s;i++){let o=e[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new nt(n,3))}else{let n=Math.min(e.length,t.count);for(let i=0;i<n;i++){let s=e[i];t.setXYZ(i,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new In);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new F(-1/0,-1/0,-1/0),new F(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let s=t[n];en.setFromBufferAttribute(s),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new F,1/0);return}if(e){let n=this.boundingSphere.center;if(en.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){let l=t[s];Vs.setFromBufferAttribute(l),this.morphTargetsRelative?(Tt.addVectors(en.min,Vs.min),en.expandByPoint(Tt),Tt.addVectors(en.max,Vs.max),en.expandByPoint(Tt)):(en.expandByPoint(Vs.min),en.expandByPoint(Vs.max))}en.getCenter(n);let i=0;for(let s=0,o=e.count;s<o;s++)Tt.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(Tt));if(t)for(let s=0,o=t.length;s<o;s++){let l=t[s],c=this.morphTargetsRelative;for(let h=0,a=l.count;h<a;h++)Tt.fromBufferAttribute(l,h),c&&(is.fromBufferAttribute(e,h),Tt.add(is)),i=Math.max(i,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,i=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ft(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),l=[],c=[];for(let R=0;R<n.count;R++)l[R]=new F,c[R]=new F;let h=new F,a=new F,u=new F,d=new Ee,f=new Ee,m=new Ee,x=new F,p=new F;function g(R,M,b){h.fromBufferAttribute(n,R),a.fromBufferAttribute(n,M),u.fromBufferAttribute(n,b),d.fromBufferAttribute(s,R),f.fromBufferAttribute(s,M),m.fromBufferAttribute(s,b),a.sub(h),u.sub(h),f.sub(d),m.sub(d);let P=1/(f.x*m.y-m.x*f.y);isFinite(P)&&(x.copy(a).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(P),p.copy(u).multiplyScalar(f.x).addScaledVector(a,-m.x).multiplyScalar(P),l[R].add(x),l[M].add(x),l[b].add(x),c[R].add(p),c[M].add(p),c[b].add(p))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let R=0,M=_.length;R<M;++R){let b=_[R],P=b.start,B=b.count;for(let L=P,U=P+B;L<U;L+=3)g(e.getX(L+0),e.getX(L+1),e.getX(L+2))}let y=new F,v=new F,T=new F,A=new F;function C(R){T.fromBufferAttribute(i,R),A.copy(T);let M=l[R];y.copy(M),y.sub(T.multiplyScalar(T.dot(M))).normalize(),v.crossVectors(A,M);let P=v.dot(c[R])<0?-1:1;o.setXYZW(R,y.x,y.y,y.z,P)}for(let R=0,M=_.length;R<M;++R){let b=_[R],P=b.start,B=b.count;for(let L=P,U=P+B;L<U;L+=3)C(e.getX(L+0)),C(e.getX(L+1)),C(e.getX(L+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ft(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let i=new F,s=new F,o=new F,l=new F,c=new F,h=new F,a=new F,u=new F;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);i.fromBufferAttribute(t,m),s.fromBufferAttribute(t,x),o.fromBufferAttribute(t,p),a.subVectors(o,s),u.subVectors(i,s),a.cross(u),l.fromBufferAttribute(n,m),c.fromBufferAttribute(n,x),h.fromBufferAttribute(n,p),l.add(a),c.add(a),h.add(a),n.setXYZ(m,l.x,l.y,l.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(p,h.x,h.y,h.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),a.subVectors(o,s),u.subVectors(i,s),a.cross(u),n.setXYZ(d+0,a.x,a.y,a.z),n.setXYZ(d+1,a.x,a.y,a.z),n.setXYZ(d+2,a.x,a.y,a.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(l,c){let h=l.array,a=l.itemSize,u=l.normalized,d=new h.constructor(c.length*a),f=0,m=0;for(let x=0,p=c.length;x<p;x++){l.isInterleavedBufferAttribute?f=c[x]*l.data.stride+l.offset:f=c[x]*a;for(let g=0;g<a;g++)d[m++]=h[f++]}return new Ft(d,a,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new r,n=this.index.array,i=this.attributes;for(let l in i){let c=i[l],h=e(c,n);t.setAttribute(l,h)}let s=this.morphAttributes;for(let l in s){let c=[],h=s[l];for(let a=0,u=h.length;a<u;a++){let d=h[a],f=e(d,n);c.push(f)}t.morphAttributes[l]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let l=0,c=o.length;l<c;l++){let h=o[l];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let h in c)c[h]!==void 0&&(e[h]=c[h]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let h=n[c];e.data.attributes[c]=h.toJSON(e.data)}let i={},s=!1;for(let c in this.morphAttributes){let h=this.morphAttributes[c],a=[];for(let u=0,d=h.length;u<d;u++){let f=h[u];a.push(f.toJSON(e.data))}a.length>0&&(i[c]=a,s=!0)}s&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let l=this.boundingSphere;return l!==null&&(e.data.boundingSphere=l.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let i=e.attributes;for(let h in i){let a=i[h];this.setAttribute(h,a.clone(t))}let s=e.morphAttributes;for(let h in s){let a=[],u=s[h];for(let d=0,f=u.length;d<f;d++)a.push(u[d].clone(t));this.morphAttributes[h]=a}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let h=0,a=o.length;h<a;h++){let u=o[h];this.addGroup(u.start,u.count,u.materialIndex)}let l=e.boundingBox;l!==null&&(this.boundingBox=l.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Wh=new rt,Ai=new vo,Jr=new hi,qh=new F,Qr=new F,eo=new F,to=new F,zl=new F,no=new F,Xh=new F,io=new F,ht=class extends Et{constructor(e=new Bt,t=new Ht){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){let l=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[l]=s}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let l=this.morphTargetInfluences;if(s&&l){no.set(0,0,0);for(let c=0,h=s.length;c<h;c++){let a=l[c],u=s[c];a!==0&&(zl.fromBufferAttribute(u,e),o?no.addScaledVector(zl,a):no.addScaledVector(zl.sub(t),a))}t.add(no)}return t}raycast(e,t){let n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Jr.copy(n.boundingSphere),Jr.applyMatrix4(s),Ai.copy(e.ray).recast(e.near),!(Jr.containsPoint(Ai.origin)===!1&&(Ai.intersectSphere(Jr,qh)===null||Ai.origin.distanceToSquared(qh)>(e.far-e.near)**2))&&(Wh.copy(s).invert(),Ai.copy(e.ray).applyMatrix4(Wh),!(n.boundingBox!==null&&Ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ai)))}_computeIntersections(e,t,n){let i,s=this.geometry,o=this.material,l=s.index,c=s.attributes.position,h=s.attributes.uv,a=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(l!==null)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let p=d[m],g=o[p.materialIndex],_=Math.max(p.start,f.start),y=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let v=_,T=y;v<T;v+=3){let A=l.getX(v),C=l.getX(v+1),R=l.getX(v+2);i=so(this,g,e,n,h,a,u,A,C,R),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){let _=l.getX(p),y=l.getX(p+1),v=l.getX(p+2);i=so(this,o,e,n,h,a,u,_,y,v),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,x=d.length;m<x;m++){let p=d[m],g=o[p.materialIndex],_=Math.max(p.start,f.start),y=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let v=_,T=y;v<T;v+=3){let A=v,C=v+1,R=v+2;i=so(this,g,e,n,h,a,u,A,C,R),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=p.materialIndex,t.push(i))}}else{let m=Math.max(0,f.start),x=Math.min(c.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){let _=p,y=p+1,v=p+2;i=so(this,o,e,n,h,a,u,_,y,v),i&&(i.faceIndex=Math.floor(p/3),t.push(i))}}}};function Kf(r,e,t,n,i,s,o,l){let c;if(e.side===Gt?c=n.intersectTriangle(o,s,i,!0,l):c=n.intersectTriangle(i,s,o,e.side===Wn,l),c===null)return null;io.copy(l),io.applyMatrix4(r.matrixWorld);let h=t.ray.origin.distanceTo(io);return h<t.near||h>t.far?null:{distance:h,point:io.clone(),object:r}}function so(r,e,t,n,i,s,o,l,c,h){r.getVertexPosition(l,Qr),r.getVertexPosition(c,eo),r.getVertexPosition(h,to);let a=Kf(r,e,t,n,Qr,eo,to,Xh);if(a){let u=new F;ai.getBarycoord(Xh,Qr,eo,to,u),i&&(a.uv=ai.getInterpolatedAttribute(i,l,c,h,u,new Ee)),s&&(a.uv1=ai.getInterpolatedAttribute(s,l,c,h,u,new Ee)),o&&(a.normal=ai.getInterpolatedAttribute(o,l,c,h,u,new F),a.normal.dot(n.direction)>0&&a.normal.multiplyScalar(-1));let d={a:l,b:c,c:h,normal:new F,materialIndex:0};ai.getNormal(Qr,eo,to,d.normal),a.face=d,a.barycoord=u}return a}var yn=class r extends Bt{constructor(e=1,t=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};let l=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);let c=[],h=[],a=[],u=[],d=0,f=0;m("z","y","x",-1,-1,n,t,e,o,s,0),m("z","y","x",1,-1,n,t,-e,o,s,1),m("x","z","y",1,1,e,n,t,i,o,2),m("x","z","y",1,-1,e,n,-t,i,o,3),m("x","y","z",1,-1,e,t,n,i,s,4),m("x","y","z",-1,-1,e,t,-n,i,s,5),this.setIndex(c),this.setAttribute("position",new nt(h,3)),this.setAttribute("normal",new nt(a,3)),this.setAttribute("uv",new nt(u,2));function m(x,p,g,_,y,v,T,A,C,R,M){let b=v/C,P=T/R,B=v/2,L=T/2,U=A/2,O=C+1,D=R+1,j=0,H=0,Z=new F;for(let ae=0;ae<D;ae++){let de=ae*P-L;for(let re=0;re<O;re++){let Ze=re*b-B;Z[x]=Ze*_,Z[p]=de*y,Z[g]=U,h.push(Z.x,Z.y,Z.z),Z[x]=0,Z[p]=0,Z[g]=A>0?1:-1,a.push(Z.x,Z.y,Z.z),u.push(re/C),u.push(1-ae/R),j+=1}}for(let ae=0;ae<R;ae++)for(let de=0;de<C;de++){let re=d+de+O*ae,Ze=d+de+O*(ae+1),et=d+(de+1)+O*(ae+1),Ye=d+(de+1)+O*ae;c.push(re,Ze,Ye),c.push(Ze,et,Ye),H+=6}l.addGroup(f,H,M),f+=H,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function zi(r){let e={};for(let t in r){e[t]={};for(let n in r[t]){let i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function zt(r){let e={};for(let t=0;t<r.length;t++){let n=zi(r[t]);for(let i in n)e[i]=n[i]}return e}function Jf(r){let e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function vc(r){let e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:je.workingColorSpace}var Hu={clone:zi,merge:zt},Qf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ep=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,bn=class extends ui{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Qf,this.fragmentShader=ep,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=zi(e.uniforms),this.uniformsGroups=Jf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},nr=class extends Et{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new rt,this.projectionMatrix=new rt,this.projectionMatrixInverse=new rt,this.coordinateSystem=xn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},oi=new F,Yh=new Ee,$h=new Ee,Xt=class extends nr{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=hs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Ws*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return hs*2*Math.atan(Math.tan(Ws*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(oi.x,oi.y).multiplyScalar(-e/oi.z),oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(oi.x,oi.y).multiplyScalar(-e/oi.z)}getViewSize(e,t){return this.getViewBounds(e,Yh,$h),t.subVectors($h,Yh)}setViewOffset(e,t,n,i,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Ws*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,s=-.5*i,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,h=o.fullHeight;s+=o.offsetX*i/c,t-=o.offsetY*n/h,i*=o.width/c,n*=o.height/h}let l=this.filmOffset;l!==0&&(s+=e*l/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ss=-90,rs=1,yo=class extends Et{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Xt(ss,rs,e,t);i.layers=this.layers,this.add(i);let s=new Xt(ss,rs,e,t);s.layers=this.layers,this.add(s);let o=new Xt(ss,rs,e,t);o.layers=this.layers,this.add(o);let l=new Xt(ss,rs,e,t);l.layers=this.layers,this.add(l);let c=new Xt(ss,rs,e,t);c.layers=this.layers,this.add(c);let h=new Xt(ss,rs,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,s,o,l,c]=t;for(let h of t)this.remove(h);if(e===xn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),l.up.set(0,1,0),l.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===js)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),l.up.set(0,-1,0),l.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,o,l,c,h,a]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,s),e.setRenderTarget(n,1,i),e.render(t,o),e.setRenderTarget(n,2,i),e.render(t,l),e.setRenderTarget(n,3,i),e.render(t,c),e.setRenderTarget(n,4,i),e.render(t,h),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,i),e.render(t,a),e.setRenderTarget(u,d,f),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},ir=class extends Vt{constructor(e=[],t=Bi,n,i,s,o,l,c,h,a){super(e,t,n,i,s,o,l,c,h,a),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},bo=class extends Rn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new ir(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new yn(5,5,5),s=new bn({name:"CubemapFromEquirect",uniforms:zi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Gt,blending:$n});s.uniforms.tEquirect.value=t;let o=new ht(i,s),l=t.minFilter;return t.minFilter===pi&&(t.minFilter=_n),new yo(1,10,this).update(e,o),t.minFilter=l,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){let s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(s)}},ct=class extends Et{constructor(){super(),this.isGroup=!0,this.type="Group"}},tp={type:"move"},fs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ct,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ct,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new F,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new F),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ct,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new F,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new F),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,s=null,o=null,l=this._targetRay,c=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){o=!0;for(let x of e.hand.values()){let p=t.getJointPose(x,n),g=this._getHandJoint(h,x);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}let a=h.joints["index-finger-tip"],u=h.joints["thumb-tip"],d=a.position.distanceTo(u.position),f=.02,m=.005;h.inputState.pinching&&d>f+m?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=f-m&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));l!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(l.matrix.fromArray(i.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,i.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(i.linearVelocity)):l.hasLinearVelocity=!1,i.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(i.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(tp)))}return l!==null&&(l.visible=i!==null),c!==null&&(c.visible=s!==null),h!==null&&(h.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ct;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}};var sr=class r{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ge(e),this.near=t,this.far=n}clone(){return new r(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},rr=class extends Et{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new vn,this.environmentIntensity=1,this.environmentRotation=new vn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var wo=class extends Vt{constructor(e=null,t=1,n=1,i,s,o,l,c,h=Yt,a=Yt,u,d){super(null,o,l,c,h,a,i,s,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ps=class extends Ft{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},os=new rt,Zh=new rt,ro=[],jh=new In,np=new rt,Hs=new ht,Gs=new hi,or=class extends ht{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ps(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,np)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new In),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,os),jh.copy(e.boundingBox).applyMatrix4(os),this.boundingBox.union(jh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new hi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,os),Gs.copy(e.boundingSphere).applyMatrix4(os),this.boundingSphere.union(Gs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,o=e*s+1;for(let l=0;l<n.length;l++)n[l]=i[o+l]}raycast(e,t){let n=this.matrixWorld,i=this.count;if(Hs.geometry=this.geometry,Hs.material=this.material,Hs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Gs.copy(this.boundingSphere),Gs.applyMatrix4(n),e.ray.intersectsSphere(Gs)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,os),Zh.multiplyMatrices(n,os),Hs.matrixWorld=Zh,Hs.raycast(e,ro);for(let o=0,l=ro.length;o<l;o++){let c=ro[o];c.instanceId=s,c.object=this,t.push(c)}ro.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new ps(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new wo(new Float32Array(i*this.count),i,this.count,sa,Mn));let s=this.morphTexture.source.data.data,o=0;for(let h=0;h<n.length;h++)o+=n[h];let l=this.geometry.morphTargetsRelative?1:1-o,c=i*e;s[c]=l,s.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ol=new F,ip=new F,sp=new ze,Cn=class{constructor(e=new F(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Ol.subVectors(n,t).cross(ip.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Ol),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||sp.getNormalMatrix(e),i=this.coplanarPoint(Ol).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ti=new hi,rp=new Ee(.5,.5),oo=new F,ms=class{constructor(e=new Cn,t=new Cn,n=new Cn,i=new Cn,s=new Cn,o=new Cn){this.planes=[e,t,n,i,s,o]}set(e,t,n,i,s,o){let l=this.planes;return l[0].copy(e),l[1].copy(t),l[2].copy(n),l[3].copy(i),l[4].copy(s),l[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=xn,n=!1){let i=this.planes,s=e.elements,o=s[0],l=s[1],c=s[2],h=s[3],a=s[4],u=s[5],d=s[6],f=s[7],m=s[8],x=s[9],p=s[10],g=s[11],_=s[12],y=s[13],v=s[14],T=s[15];if(i[0].setComponents(h-o,f-a,g-m,T-_).normalize(),i[1].setComponents(h+o,f+a,g+m,T+_).normalize(),i[2].setComponents(h+l,f+u,g+x,T+y).normalize(),i[3].setComponents(h-l,f-u,g-x,T-y).normalize(),n)i[4].setComponents(c,d,p,v).normalize(),i[5].setComponents(h-c,f-d,g-p,T-v).normalize();else if(i[4].setComponents(h-c,f-d,g-p,T-v).normalize(),t===xn)i[5].setComponents(h+c,f+d,g+p,T+v).normalize();else if(t===js)i[5].setComponents(c,d,p,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(e){Ti.center.set(0,0,0);let t=rp.distanceTo(e.center);return Ti.radius=.7071067811865476+t,Ti.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(oo.x=i.normal.x>0?e.max.x:e.min.x,oo.y=i.normal.y>0?e.max.y:e.min.y,oo.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(oo)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var gs=class extends Vt{constructor(e,t,n,i,s,o,l,c,h){super(e,t,n,i,s,o,l,c,h),this.isCanvasTexture=!0,this.needsUpdate=!0}},ar=class extends Vt{constructor(e,t,n=mi,i,s,o,l=Yt,c=Yt,h,a=cs,u=1){if(a!==cs&&a!==bs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,i,s,o,l,c,a,n,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ds(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},lr=class extends Vt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var cr=class r extends Bt{constructor(e=1,t=1,n=1,i=32,s=1,o=!1,l=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:s,openEnded:o,thetaStart:l,thetaLength:c};let h=this;i=Math.floor(i),s=Math.floor(s);let a=[],u=[],d=[],f=[],m=0,x=[],p=n/2,g=0;_(),o===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(a),this.setAttribute("position",new nt(u,3)),this.setAttribute("normal",new nt(d,3)),this.setAttribute("uv",new nt(f,2));function _(){let v=new F,T=new F,A=0,C=(t-e)/n;for(let R=0;R<=s;R++){let M=[],b=R/s,P=b*(t-e)+e;for(let B=0;B<=i;B++){let L=B/i,U=L*c+l,O=Math.sin(U),D=Math.cos(U);T.x=P*O,T.y=-b*n+p,T.z=P*D,u.push(T.x,T.y,T.z),v.set(O,C,D).normalize(),d.push(v.x,v.y,v.z),f.push(L,1-b),M.push(m++)}x.push(M)}for(let R=0;R<i;R++)for(let M=0;M<s;M++){let b=x[M][R],P=x[M+1][R],B=x[M+1][R+1],L=x[M][R+1];(e>0||M!==0)&&(a.push(b,P,L),A+=3),(t>0||M!==s-1)&&(a.push(P,B,L),A+=3)}h.addGroup(g,A,0),g+=A}function y(v){let T=m,A=new Ee,C=new F,R=0,M=v===!0?e:t,b=v===!0?1:-1;for(let B=1;B<=i;B++)u.push(0,p*b,0),d.push(0,b,0),f.push(.5,.5),m++;let P=m;for(let B=0;B<=i;B++){let U=B/i*c+l,O=Math.cos(U),D=Math.sin(U);C.x=M*D,C.y=p*b,C.z=M*O,u.push(C.x,C.y,C.z),d.push(0,b,0),A.x=O*.5+.5,A.y=D*.5*b+.5,f.push(A.x,A.y),m++}for(let B=0;B<i;B++){let L=T+B,U=P+B;v===!0?a.push(U,U+1,L):a.push(U+1,U,L),R+=3}h.addGroup(g,R,v===!0?1:2),g+=R}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Mo=class r extends Bt{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let s=[],o=[];l(i),h(n),a(),this.setAttribute("position",new nt(s,3)),this.setAttribute("normal",new nt(s.slice(),3)),this.setAttribute("uv",new nt(o,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function l(_){let y=new F,v=new F,T=new F;for(let A=0;A<t.length;A+=3)f(t[A+0],y),f(t[A+1],v),f(t[A+2],T),c(y,v,T,_)}function c(_,y,v,T){let A=T+1,C=[];for(let R=0;R<=A;R++){C[R]=[];let M=_.clone().lerp(v,R/A),b=y.clone().lerp(v,R/A),P=A-R;for(let B=0;B<=P;B++)B===0&&R===A?C[R][B]=M:C[R][B]=M.clone().lerp(b,B/P)}for(let R=0;R<A;R++)for(let M=0;M<2*(A-R)-1;M++){let b=Math.floor(M/2);M%2===0?(d(C[R][b+1]),d(C[R+1][b]),d(C[R][b])):(d(C[R][b+1]),d(C[R+1][b+1]),d(C[R+1][b]))}}function h(_){let y=new F;for(let v=0;v<s.length;v+=3)y.x=s[v+0],y.y=s[v+1],y.z=s[v+2],y.normalize().multiplyScalar(_),s[v+0]=y.x,s[v+1]=y.y,s[v+2]=y.z}function a(){let _=new F;for(let y=0;y<s.length;y+=3){_.x=s[y+0],_.y=s[y+1],_.z=s[y+2];let v=p(_)/2/Math.PI+.5,T=g(_)/Math.PI+.5;o.push(v,1-T)}m(),u()}function u(){for(let _=0;_<o.length;_+=6){let y=o[_+0],v=o[_+2],T=o[_+4],A=Math.max(y,v,T),C=Math.min(y,v,T);A>.9&&C<.1&&(y<.2&&(o[_+0]+=1),v<.2&&(o[_+2]+=1),T<.2&&(o[_+4]+=1))}}function d(_){s.push(_.x,_.y,_.z)}function f(_,y){let v=_*3;y.x=e[v+0],y.y=e[v+1],y.z=e[v+2]}function m(){let _=new F,y=new F,v=new F,T=new F,A=new Ee,C=new Ee,R=new Ee;for(let M=0,b=0;M<s.length;M+=9,b+=6){_.set(s[M+0],s[M+1],s[M+2]),y.set(s[M+3],s[M+4],s[M+5]),v.set(s[M+6],s[M+7],s[M+8]),A.set(o[b+0],o[b+1]),C.set(o[b+2],o[b+3]),R.set(o[b+4],o[b+5]),T.copy(_).add(y).add(v).divideScalar(3);let P=p(T);x(A,b+0,_,P),x(C,b+2,y,P),x(R,b+4,v,P)}}function x(_,y,v,T){T<0&&_.x===1&&(o[y]=_.x-1),v.x===0&&v.z===0&&(o[y]=T/2/Math.PI+.5)}function p(_){return Math.atan2(_.z,-_.x)}function g(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.vertices,e.indices,e.radius,e.details)}};var ln=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),s=0;t.push(0);for(let o=1;o<=e;o++)n=this.getPoint(o/e),s+=n.distanceTo(i),t.push(s),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),i=0,s=n.length,o;t?o=t:o=e*n[s-1];let l=0,c=s-1,h;for(;l<=c;)if(i=Math.floor(l+(c-l)/2),h=n[i]-o,h<0)l=i+1;else if(h>0)c=i-1;else{c=i;break}if(i=c,n[i]===o)return i/(s-1);let a=n[i],d=n[i+1]-a,f=(o-a)/d;return(i+f)/(s-1)}getTangent(e,t){let i=e-1e-4,s=e+1e-4;i<0&&(i=0),s>1&&(s=1);let o=this.getPoint(i),l=this.getPoint(s),c=t||(o.isVector2?new Ee:new F);return c.copy(l).sub(o).normalize(),c}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new F,i=[],s=[],o=[],l=new F,c=new rt;for(let f=0;f<=e;f++){let m=f/e;i[f]=this.getTangentAt(m,new F)}s[0]=new F,o[0]=new F;let h=Number.MAX_VALUE,a=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);a<=h&&(h=a,n.set(1,0,0)),u<=h&&(h=u,n.set(0,1,0)),d<=h&&n.set(0,0,1),l.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],l),o[0].crossVectors(i[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),o[f]=o[f-1].clone(),l.crossVectors(i[f-1],i[f]),l.length()>Number.EPSILON){l.normalize();let m=Math.acos(We(i[f-1].dot(i[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(l,m))}o[f].crossVectors(i[f],s[f])}if(t===!0){let f=Math.acos(We(s[0].dot(s[e]),-1,1));f/=e,i[0].dot(l.crossVectors(s[0],s[e]))>0&&(f=-f);for(let m=1;m<=e;m++)s[m].applyMatrix4(c.makeRotationAxis(i[m],f*m)),o[m].crossVectors(i[m],s[m])}return{tangents:i,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},hr=class extends ln{constructor(e=0,t=0,n=1,i=1,s=0,o=Math.PI*2,l=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=l,this.aRotation=c}getPoint(e,t=new Ee){let n=t,i=Math.PI*2,s=this.aEndAngle-this.aStartAngle,o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(o?s=0:s=i),this.aClockwise===!0&&!o&&(s===i?s=-i:s=s-i);let l=this.aStartAngle+e*s,c=this.aX+this.xRadius*Math.cos(l),h=this.aY+this.yRadius*Math.sin(l);if(this.aRotation!==0){let a=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=c-this.aX,f=h-this.aY;c=d*a-f*u+this.aX,h=d*u+f*a+this.aY}return n.set(c,h)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},So=class extends hr{constructor(e,t,n,i,s,o){super(e,t,n,n,i,s,o),this.isArcCurve=!0,this.type="ArcCurve"}};function yc(){let r=0,e=0,t=0,n=0;function i(s,o,l,c){r=s,e=l,t=-3*s+3*o-2*l-c,n=2*s-2*o+l+c}return{initCatmullRom:function(s,o,l,c,h){i(o,l,h*(l-s),h*(c-o))},initNonuniformCatmullRom:function(s,o,l,c,h,a,u){let d=(o-s)/h-(l-s)/(h+a)+(l-o)/a,f=(l-o)/a-(c-o)/(a+u)+(c-l)/u;d*=a,f*=a,i(o,l,d,f)},calc:function(s){let o=s*s,l=o*s;return r+e*s+t*o+n*l}}}var ao=new F,kl=new yc,Vl=new yc,Hl=new yc,xs=class extends ln{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new F){let n=t,i=this.points,s=i.length,o=(s-(this.closed?0:1))*e,l=Math.floor(o),c=o-l;this.closed?l+=l>0?0:(Math.floor(Math.abs(l)/s)+1)*s:c===0&&l===s-1&&(l=s-2,c=1);let h,a;this.closed||l>0?h=i[(l-1)%s]:(ao.subVectors(i[0],i[1]).add(i[0]),h=ao);let u=i[l%s],d=i[(l+1)%s];if(this.closed||l+2<s?a=i[(l+2)%s]:(ao.subVectors(i[s-1],i[s-2]).add(i[s-1]),a=ao),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(h.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),p=Math.pow(d.distanceToSquared(a),f);x<1e-4&&(x=1),m<1e-4&&(m=x),p<1e-4&&(p=x),kl.initNonuniformCatmullRom(h.x,u.x,d.x,a.x,m,x,p),Vl.initNonuniformCatmullRom(h.y,u.y,d.y,a.y,m,x,p),Hl.initNonuniformCatmullRom(h.z,u.z,d.z,a.z,m,x,p)}else this.curveType==="catmullrom"&&(kl.initCatmullRom(h.x,u.x,d.x,a.x,this.tension),Vl.initCatmullRom(h.y,u.y,d.y,a.y,this.tension),Hl.initCatmullRom(h.z,u.z,d.z,a.z,this.tension));return n.set(kl.calc(c),Vl.calc(c),Hl.calc(c)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new F().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Kh(r,e,t,n,i){let s=(n-e)*.5,o=(i-t)*.5,l=r*r,c=r*l;return(2*t-2*n+s+o)*c+(-3*t+3*n-2*s-o)*l+s*r+t}function op(r,e){let t=1-r;return t*t*e}function ap(r,e){return 2*(1-r)*r*e}function lp(r,e){return r*r*e}function Xs(r,e,t,n){return op(r,e)+ap(r,t)+lp(r,n)}function cp(r,e){let t=1-r;return t*t*t*e}function hp(r,e){let t=1-r;return 3*t*t*r*e}function up(r,e){return 3*(1-r)*r*r*e}function dp(r,e){return r*r*r*e}function Ys(r,e,t,n,i){return cp(r,e)+hp(r,t)+up(r,n)+dp(r,i)}var Ao=class extends ln{constructor(e=new Ee,t=new Ee,n=new Ee,i=new Ee){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new Ee){let n=t,i=this.v0,s=this.v1,o=this.v2,l=this.v3;return n.set(Ys(e,i.x,s.x,o.x,l.x),Ys(e,i.y,s.y,o.y,l.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},To=class extends ln{constructor(e=new F,t=new F,n=new F,i=new F){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new F){let n=t,i=this.v0,s=this.v1,o=this.v2,l=this.v3;return n.set(Ys(e,i.x,s.x,o.x,l.x),Ys(e,i.y,s.y,o.y,l.y),Ys(e,i.z,s.z,o.z,l.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Eo=class extends ln{constructor(e=new Ee,t=new Ee){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Ee){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Ee){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Co=class extends ln{constructor(e=new F,t=new F){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new F){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new F){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ro=class extends ln{constructor(e=new Ee,t=new Ee,n=new Ee){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new Ee){let n=t,i=this.v0,s=this.v1,o=this.v2;return n.set(Xs(e,i.x,s.x,o.x),Xs(e,i.y,s.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ur=class extends ln{constructor(e=new F,t=new F,n=new F){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new F){let n=t,i=this.v0,s=this.v1,o=this.v2;return n.set(Xs(e,i.x,s.x,o.x),Xs(e,i.y,s.y,o.y),Xs(e,i.z,s.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Io=class extends ln{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Ee){let n=t,i=this.points,s=(i.length-1)*e,o=Math.floor(s),l=s-o,c=i[o===0?o:o-1],h=i[o],a=i[o>i.length-2?i.length-1:o+1],u=i[o>i.length-3?i.length-1:o+2];return n.set(Kh(l,c.x,h.x,a.x,u.x),Kh(l,c.y,h.y,a.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new Ee().fromArray(i))}return this}},fp=Object.freeze({__proto__:null,ArcCurve:So,CatmullRomCurve3:xs,CubicBezierCurve:Ao,CubicBezierCurve3:To,EllipseCurve:hr,LineCurve:Eo,LineCurve3:Co,QuadraticBezierCurve:Ro,QuadraticBezierCurve3:ur,SplineCurve:Io});var Yn=class r extends Bt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let s=e/2,o=t/2,l=Math.floor(n),c=Math.floor(i),h=l+1,a=c+1,u=e/l,d=t/c,f=[],m=[],x=[],p=[];for(let g=0;g<a;g++){let _=g*d-o;for(let y=0;y<h;y++){let v=y*u-s;m.push(v,-_,0),x.push(0,0,1),p.push(y/l),p.push(1-g/c)}}for(let g=0;g<c;g++)for(let _=0;_<l;_++){let y=_+h*g,v=_+h*(g+1),T=_+1+h*(g+1),A=_+1+h*g;f.push(y,v,A),f.push(v,T,A)}this.setIndex(f),this.setAttribute("position",new nt(m,3)),this.setAttribute("normal",new nt(x,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.widthSegments,e.heightSegments)}},Pi=class r extends Bt{constructor(e=.5,t=1,n=32,i=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:o},n=Math.max(3,n),i=Math.max(1,i);let l=[],c=[],h=[],a=[],u=e,d=(t-e)/i,f=new F,m=new Ee;for(let x=0;x<=i;x++){for(let p=0;p<=n;p++){let g=s+p/n*o;f.x=u*Math.cos(g),f.y=u*Math.sin(g),c.push(f.x,f.y,f.z),h.push(0,0,1),m.x=(f.x/t+1)/2,m.y=(f.y/t+1)/2,a.push(m.x,m.y)}u+=d}for(let x=0;x<i;x++){let p=x*(n+1);for(let g=0;g<n;g++){let _=g+p,y=_,v=_+n+1,T=_+n+2,A=_+1;l.push(y,v,A),l.push(v,T,A)}}this.setIndex(l),this.setAttribute("position",new nt(c,3)),this.setAttribute("normal",new nt(h,3)),this.setAttribute("uv",new nt(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Li=class r extends Bt{constructor(e=1,t=32,n=16,i=0,s=Math.PI*2,o=0,l=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:s,thetaStart:o,thetaLength:l},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let c=Math.min(o+l,Math.PI),h=0,a=[],u=new F,d=new F,f=[],m=[],x=[],p=[];for(let g=0;g<=n;g++){let _=[],y=g/n,v=0;g===0&&o===0?v=.5/t:g===n&&c===Math.PI&&(v=-.5/t);for(let T=0;T<=t;T++){let A=T/t;u.x=-e*Math.cos(i+A*s)*Math.sin(o+y*l),u.y=e*Math.cos(o+y*l),u.z=e*Math.sin(i+A*s)*Math.sin(o+y*l),m.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),p.push(A+v,1-y),_.push(h++)}a.push(_)}for(let g=0;g<n;g++)for(let _=0;_<t;_++){let y=a[g][_+1],v=a[g][_],T=a[g+1][_],A=a[g+1][_+1];(g!==0||o>0)&&f.push(y,v,A),(g!==n-1||c<Math.PI)&&f.push(v,T,A)}this.setIndex(f),this.setAttribute("position",new nt(m,3)),this.setAttribute("normal",new nt(x,3)),this.setAttribute("uv",new nt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},dr=class r extends Mo{constructor(e=1,t=0){let n=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],i=[2,1,0,0,3,2,1,3,0,2,3,1];super(n,i,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},fr=class r extends Bt{constructor(e=1,t=.4,n=12,i=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:s},n=Math.floor(n),i=Math.floor(i);let o=[],l=[],c=[],h=[],a=new F,u=new F,d=new F;for(let f=0;f<=n;f++)for(let m=0;m<=i;m++){let x=m/i*s,p=f/n*Math.PI*2;u.x=(e+t*Math.cos(p))*Math.cos(x),u.y=(e+t*Math.cos(p))*Math.sin(x),u.z=t*Math.sin(p),l.push(u.x,u.y,u.z),a.x=e*Math.cos(x),a.y=e*Math.sin(x),d.subVectors(u,a).normalize(),c.push(d.x,d.y,d.z),h.push(m/i),h.push(f/n)}for(let f=1;f<=n;f++)for(let m=1;m<=i;m++){let x=(i+1)*f+m-1,p=(i+1)*(f-1)+m-1,g=(i+1)*(f-1)+m,_=(i+1)*f+m;o.push(x,p,_),o.push(p,g,_)}this.setIndex(o),this.setAttribute("position",new nt(l,3)),this.setAttribute("normal",new nt(c,3)),this.setAttribute("uv",new nt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var pr=class r extends Bt{constructor(e=new ur(new F(-1,-1,0),new F(-1,1,0),new F(1,1,0)),t=64,n=1,i=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:s};let o=e.computeFrenetFrames(t,s);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let l=new F,c=new F,h=new Ee,a=new F,u=[],d=[],f=[],m=[];x(),this.setIndex(m),this.setAttribute("position",new nt(u,3)),this.setAttribute("normal",new nt(d,3)),this.setAttribute("uv",new nt(f,2));function x(){for(let y=0;y<t;y++)p(y);p(s===!1?t:0),_(),g()}function p(y){a=e.getPointAt(y/t,a);let v=o.normals[y],T=o.binormals[y];for(let A=0;A<=i;A++){let C=A/i*Math.PI*2,R=Math.sin(C),M=-Math.cos(C);c.x=M*v.x+R*T.x,c.y=M*v.y+R*T.y,c.z=M*v.z+R*T.z,c.normalize(),d.push(c.x,c.y,c.z),l.x=a.x+n*c.x,l.y=a.y+n*c.y,l.z=a.z+n*c.z,u.push(l.x,l.y,l.z)}}function g(){for(let y=1;y<=t;y++)for(let v=1;v<=i;v++){let T=(i+1)*(y-1)+(v-1),A=(i+1)*y+(v-1),C=(i+1)*y+v,R=(i+1)*(y-1)+v;m.push(T,A,R),m.push(A,C,R)}}function _(){for(let y=0;y<=t;y++)for(let v=0;v<=i;v++)h.x=y/t,h.y=v/i,f.push(h.x,h.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new r(new fp[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Ni=class extends ui{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ge(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ge(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=dc,this.normalScale=new Ee(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Po=class extends ui{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ru,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Lo=class extends ui{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function lo(r,e){return!r||r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function pp(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}var Di=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],s=t[n-1];n:{e:{let o;t:{i:if(!(e<i)){for(let l=n+2;;){if(i===void 0){if(e<s)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===l)break;if(s=i,i=t[++n],e<i)break e}o=t.length;break t}if(!(e>=s)){let l=t[1];e<l&&(n=2,s=l);for(let c=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=s,s=t[--n-1],e>=s)break e}o=n,n=0;break t}break n}for(;n<o;){let l=n+o>>>1;e<t[l]?o=l:n=l+1}if(i=t[n],s=t[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=e*i;for(let o=0;o!==i;++o)t[o]=n[s+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},No=class extends Di{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Wl,endingEnd:Wl}}intervalChanged_(e,t,n){let i=this.parameterPositions,s=e-2,o=e+1,l=i[s],c=i[o];if(l===void 0)switch(this.getSettings_().endingStart){case ql:s=e,l=2*t-n;break;case Xl:s=i.length-2,l=t+i[s]-i[s+1];break;default:s=e,l=n}if(c===void 0)switch(this.getSettings_().endingEnd){case ql:o=e,c=2*n-t;break;case Xl:o=1,c=n+i[1]-i[0];break;default:o=e-1,c=t}let h=(n-t)*.5,a=this.valueSize;this._weightPrev=h/(t-l),this._weightNext=h/(c-n),this._offsetPrev=s*a,this._offsetNext=o*a}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,l=this.valueSize,c=e*l,h=c-l,a=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(n-t)/(i-t),x=m*m,p=x*m,g=-d*p+2*d*x-d*m,_=(1+d)*p+(-1.5-2*d)*x+(-.5+d)*m+1,y=(-1-f)*p+(1.5+f)*x+.5*m,v=f*p-f*x;for(let T=0;T!==l;++T)s[T]=g*o[a+T]+_*o[h+T]+y*o[c+T]+v*o[u+T];return s}},Do=class extends Di{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,l=this.valueSize,c=e*l,h=c-l,a=(n-t)/(i-t),u=1-a;for(let d=0;d!==l;++d)s[d]=o[h+d]*u+o[c+d]*a;return s}},Fo=class extends Di{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},tn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=lo(t,this.TimeBufferType),this.values=lo(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:lo(e.times,Array),values:lo(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Fo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Do(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new No(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case $s:t=this.InterpolantFactoryMethodDiscrete;break;case mo:t=this.InterpolantFactoryMethodLinear;break;case co:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return $s;case this.InterpolantFactoryMethodLinear:return mo;case this.InterpolantFactoryMethodSmooth:return co}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,s=0,o=i-1;for(;s!==i&&n[s]<e;)++s;for(;o!==-1&&n[o]>t;)--o;if(++o,s!==0||o!==i){s>=o&&(o=Math.max(o,1),s=o-1);let l=this.getValueSize();this.times=n.slice(s,o),this.values=this.values.slice(s*l,o*l)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let l=0;l!==s;l++){let c=n[l];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,l,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,l,c,o),e=!1;break}o=c}if(i!==void 0&&pp(i))for(let l=0,c=i.length;l!==c;++l){let h=i[l];if(isNaN(h)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,l,h),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===co,s=e.length-1,o=1;for(let l=1;l<s;++l){let c=!1,h=e[l],a=e[l+1];if(h!==a&&(l!==1||h!==e[0]))if(i)c=!0;else{let u=l*n,d=u-n,f=u+n;for(let m=0;m!==n;++m){let x=t[u+m];if(x!==t[d+m]||x!==t[f+m]){c=!0;break}}}if(c){if(l!==o){e[o]=e[l];let u=l*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++o}}if(s>0){e[o]=e[s];for(let l=s*n,c=o*n,h=0;h!==n;++h)t[c+h]=t[l+h];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};tn.prototype.ValueTypeName="";tn.prototype.TimeBufferType=Float32Array;tn.prototype.ValueBufferType=Float32Array;tn.prototype.DefaultInterpolation=mo;var di=class extends tn{constructor(e,t,n){super(e,t,n)}};di.prototype.ValueTypeName="bool";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=$s;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var Bo=class extends tn{constructor(e,t,n,i){super(e,t,n,i)}};Bo.prototype.ValueTypeName="color";var Uo=class extends tn{constructor(e,t,n,i){super(e,t,n,i)}};Uo.prototype.ValueTypeName="number";var zo=class extends Di{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,l=this.valueSize,c=(n-t)/(i-t),h=e*l;for(let a=h+l;h!==a;h+=4)Xn.slerpFlat(s,0,o,h-l,o,h,c);return s}},mr=class extends tn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new zo(this.times,this.values,this.getValueSize(),e)}};mr.prototype.ValueTypeName="quaternion";mr.prototype.InterpolantFactoryMethodSmooth=void 0;var fi=class extends tn{constructor(e,t,n){super(e,t,n)}};fi.prototype.ValueTypeName="string";fi.prototype.ValueBufferType=Array;fi.prototype.DefaultInterpolation=$s;fi.prototype.InterpolantFactoryMethodLinear=void 0;fi.prototype.InterpolantFactoryMethodSmooth=void 0;var Oo=class extends tn{constructor(e,t,n,i){super(e,t,n,i)}};Oo.prototype.ValueTypeName="vector";var ko=class{constructor(e,t,n){let i=this,s=!1,o=0,l=0,c,h=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(a){l++,s===!1&&i.onStart!==void 0&&i.onStart(a,o,l),s=!0},this.itemEnd=function(a){o++,i.onProgress!==void 0&&i.onProgress(a,o,l),o===l&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(a){i.onError!==void 0&&i.onError(a)},this.resolveURL=function(a){return c?c(a):a},this.setURLModifier=function(a){return c=a,this},this.addHandler=function(a,u){return h.push(a,u),this},this.removeHandler=function(a){let u=h.indexOf(a);return u!==-1&&h.splice(u,2),this},this.getHandler=function(a){for(let u=0,d=h.length;u<d;u+=2){let f=h[u],m=h[u+1];if(f.global&&(f.lastIndex=0),f.test(a))return m}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}},Gu=new ko,Vo=class{constructor(e){this.manager=e!==void 0?e:Gu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,s){n.load(e,i,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Vo.DEFAULT_MATERIAL_NAME="__DEFAULT";var gr=class extends Et{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ge(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},xr=class extends gr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ge(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Gl=new rt,Jh=new F,Qh=new F,Zl=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ee(512,512),this.mapType=wn,this.map=null,this.mapPass=null,this.matrix=new rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ms,this._frameExtents=new Ee(1,1),this._viewportCount=1,this._viewports=[new xt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Jh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Jh),Qh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Qh),t.updateMatrixWorld(),Gl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Gl,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Gl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Fi=class extends nr{constructor(e=-1,t=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,s=n-e,o=n+e,l=i+t,c=i-t;if(this.view!==null&&this.view.enabled){let h=(this.right-this.left)/this.view.fullWidth/this.zoom,a=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=h*this.view.offsetX,o=s+h*this.view.width,l-=a*this.view.offsetY,c=l-a*this.view.height}this.projectionMatrix.makeOrthographic(s,o,l,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},jl=class extends Zl{constructor(){super(new Fi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},_r=class extends gr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Et.DEFAULT_UP),this.updateMatrix(),this.target=new Et,this.shadow=new jl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Ho=class extends Xt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var bc="\\[\\]\\.:\\/",mp=new RegExp("["+bc+"]","g"),wc="[^"+bc+"]",gp="[^"+bc.replace("\\.","")+"]",xp=/((?:WC+[\/:])*)/.source.replace("WC",wc),_p=/(WCOD+)?/.source.replace("WCOD",gp),vp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",wc),yp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",wc),bp=new RegExp("^"+xp+_p+vp+yp+"$"),wp=["material","materials","bones","map"],Kl=class{constructor(e,t,n){let i=n||lt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},lt=class r{constructor(e,t,n){this.path=t,this.parsedPath=n||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,n):new r(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(mp,"")}static parseTrackName(e){let t=bp.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);wp.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(s){for(let o=0;o<s.length;o++){let l=s[o];if(l.name===t||l.uuid===t)return l;let c=n(l.children);if(c)return c}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,s=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let h=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let a=0;a<e.length;a++)if(e[a].name===h){h=a;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(h!==void 0){if(e[h]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[h]}}let o=e[i];if(o===void 0){let h=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+h+"."+i+" but it wasn't found.",e);return}let l=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?l=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(l=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][l]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};lt.Composite=Kl;lt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};lt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};lt.prototype.GetterByBindingType=[lt.prototype._getValue_direct,lt.prototype._getValue_array,lt.prototype._getValue_arrayElement,lt.prototype._getValue_toArray];lt.prototype.SetterByBindingTypeAndVersioning=[[lt.prototype._setValue_direct,lt.prototype._setValue_direct_setNeedsUpdate,lt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_array,lt.prototype._setValue_array_setNeedsUpdate,lt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_arrayElement,lt.prototype._setValue_arrayElement_setNeedsUpdate,lt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[lt.prototype._setValue_fromArray,lt.prototype._setValue_fromArray_setNeedsUpdate,lt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Vy=new Float32Array(1);function Mc(r,e,t,n){let i=Mp(n);switch(t){case cc:return r*e;case sa:return r*e/i.components*i.byteLength;case ra:return r*e/i.components*i.byteLength;case uc:return r*e*2/i.components*i.byteLength;case oa:return r*e*2/i.components*i.byteLength;case hc:return r*e*3/i.components*i.byteLength;case cn:return r*e*4/i.components*i.byteLength;case aa:return r*e*4/i.components*i.byteLength;case br:case wr:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Mr:case Sr:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ca:case ua:return Math.max(r,16)*Math.max(e,8)/4;case la:case ha:return Math.max(r,8)*Math.max(e,8)/2;case da:case fa:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case pa:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ma:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ga:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case xa:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case _a:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case va:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case ya:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case ba:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case wa:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case Ma:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case Sa:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case Aa:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case Ta:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case Ea:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case Ca:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case Ra:case Ia:case Pa:return Math.ceil(r/4)*Math.ceil(e/4)*16;case La:case Na:return Math.ceil(r/4)*Math.ceil(e/4)*8;case Da:case Fa:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Mp(r){switch(r){case wn:case rc:return{byteLength:1,components:1};case _s:case oc:case vs:return{byteLength:2,components:1};case na:case ia:return{byteLength:2,components:4};case mi:case ta:case Mn:return{byteLength:4,components:1};case ac:case lc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function fd(){let r=null,e=!1,t=null,n=null;function i(s,o){t(s,o),n=r.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(i),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function Ip(r){let e=new WeakMap;function t(l,c){let h=l.array,a=l.usage,u=h.byteLength,d=r.createBuffer();r.bindBuffer(c,d),r.bufferData(c,h,a),l.onUploadCallback();let f;if(h instanceof Float32Array)f=r.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)f=r.HALF_FLOAT;else if(h instanceof Uint16Array)l.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(h instanceof Int16Array)f=r.SHORT;else if(h instanceof Uint32Array)f=r.UNSIGNED_INT;else if(h instanceof Int32Array)f=r.INT;else if(h instanceof Int8Array)f=r.BYTE;else if(h instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:f,bytesPerElement:h.BYTES_PER_ELEMENT,version:l.version,size:u}}function n(l,c,h){let a=c.array,u=c.updateRanges;if(r.bindBuffer(h,l),u.length===0)r.bufferSubData(h,0,a);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){let m=u[d],x=u[f];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){let x=u[f];r.bufferSubData(h,x.start*a.BYTES_PER_ELEMENT,a,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(l){return l.isInterleavedBufferAttribute&&(l=l.data),e.get(l)}function s(l){l.isInterleavedBufferAttribute&&(l=l.data);let c=e.get(l);c&&(r.deleteBuffer(c.buffer),e.delete(l))}function o(l,c){if(l.isInterleavedBufferAttribute&&(l=l.data),l.isGLBufferAttribute){let a=e.get(l);(!a||a.version<l.version)&&e.set(l,{buffer:l.buffer,type:l.type,bytesPerElement:l.elementSize,version:l.version});return}let h=e.get(l);if(h===void 0)e.set(l,t(l,c));else if(h.version<l.version){if(h.size!==l.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,l,c),h.version=l.version}}return{get:i,remove:s,update:o}}var Pp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Lp=`#ifdef USE_ALPHAHASH
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
#endif`,Np=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Dp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Fp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Up=`#ifdef USE_AOMAP
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
#endif`,zp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Op=`#ifdef USE_BATCHING
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
#endif`,kp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Vp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Hp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Gp=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Wp=`#ifdef USE_IRIDESCENCE
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
#endif`,qp=`#ifdef USE_BUMPMAP
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
#endif`,Xp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Yp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,$p=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Zp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,jp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Kp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Jp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Qp=`#if defined( USE_COLOR_ALPHA )
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
#endif`,em=`#define PI 3.141592653589793
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
} // validated`,tm=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,nm=`vec3 transformedNormal = objectNormal;
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
#endif`,im=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,sm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,rm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,om=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,am="gl_FragColor = linearToOutputTexel( gl_FragColor );",lm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,cm=`#ifdef USE_ENVMAP
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
#endif`,hm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif`,um=`#ifdef USE_ENVMAP
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
#endif`,dm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,fm=`#ifdef USE_ENVMAP
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
#endif`,pm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,mm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,gm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,xm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,_m=`#ifdef USE_GRADIENTMAP
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
}`,vm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ym=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,bm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,wm=`uniform bool receiveShadow;
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
#endif`,Mm=`#ifdef USE_ENVMAP
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
#endif`,Sm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Am=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Tm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Em=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Cm=`PhysicalMaterial material;
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
#endif`,Rm=`struct PhysicalMaterial {
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
}`,Im=`
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
#endif`,Pm=`#if defined( RE_IndirectDiffuse )
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
#endif`,Lm=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Nm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Dm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Fm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Um=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,zm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Om=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,km=`#if defined( USE_POINTS_UV )
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
#endif`,Vm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Hm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Gm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Wm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,qm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xm=`#ifdef USE_MORPHTARGETS
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
#endif`,Ym=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$m=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Zm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,jm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Km=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Qm=`#ifdef USE_NORMALMAP
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
#endif`,eg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,tg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ng=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ig=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,sg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,rg=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,og=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,ag=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,lg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,cg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,hg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ug=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,dg=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,fg=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,pg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,mg=`float getShadowMask() {
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
}`,gg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,xg=`#ifdef USE_SKINNING
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
#endif`,_g=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,vg=`#ifdef USE_SKINNING
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
#endif`,yg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,bg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,wg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Mg=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Sg=`#ifdef USE_TRANSMISSION
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
#endif`,Ag=`#ifdef USE_TRANSMISSION
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
#endif`,Tg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Eg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Cg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Rg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Ig=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Pg=`uniform sampler2D t2D;
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
}`,Lg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ng=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Dg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Bg=`#include <common>
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
}`,Ug=`#if DEPTH_PACKING == 3200
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
}`,zg=`#define DISTANCE
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
}`,Og=`#define DISTANCE
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
}`,kg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Vg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hg=`uniform float scale;
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
}`,Gg=`uniform vec3 diffuse;
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
}`,Wg=`#include <common>
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
}`,qg=`uniform vec3 diffuse;
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
}`,Xg=`#define LAMBERT
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
}`,Yg=`#define LAMBERT
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
}`,$g=`#define MATCAP
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
}`,Zg=`#define MATCAP
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
}`,jg=`#define NORMAL
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
}`,Kg=`#define NORMAL
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
}`,Jg=`#define PHONG
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
}`,Qg=`#define PHONG
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
}`,e0=`#define STANDARD
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
}`,t0=`#define STANDARD
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
}`,n0=`#define TOON
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
}`,i0=`#define TOON
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
}`,s0=`uniform float size;
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
}`,r0=`uniform vec3 diffuse;
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
}`,o0=`#include <common>
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
}`,a0=`uniform vec3 color;
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
}`,l0=`uniform float rotation;
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
}`,c0=`uniform vec3 diffuse;
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
}`,Ve={alphahash_fragment:Pp,alphahash_pars_fragment:Lp,alphamap_fragment:Np,alphamap_pars_fragment:Dp,alphatest_fragment:Fp,alphatest_pars_fragment:Bp,aomap_fragment:Up,aomap_pars_fragment:zp,batching_pars_vertex:Op,batching_vertex:kp,begin_vertex:Vp,beginnormal_vertex:Hp,bsdfs:Gp,iridescence_fragment:Wp,bumpmap_pars_fragment:qp,clipping_planes_fragment:Xp,clipping_planes_pars_fragment:Yp,clipping_planes_pars_vertex:$p,clipping_planes_vertex:Zp,color_fragment:jp,color_pars_fragment:Kp,color_pars_vertex:Jp,color_vertex:Qp,common:em,cube_uv_reflection_fragment:tm,defaultnormal_vertex:nm,displacementmap_pars_vertex:im,displacementmap_vertex:sm,emissivemap_fragment:rm,emissivemap_pars_fragment:om,colorspace_fragment:am,colorspace_pars_fragment:lm,envmap_fragment:cm,envmap_common_pars_fragment:hm,envmap_pars_fragment:um,envmap_pars_vertex:dm,envmap_physical_pars_fragment:Mm,envmap_vertex:fm,fog_vertex:pm,fog_pars_vertex:mm,fog_fragment:gm,fog_pars_fragment:xm,gradientmap_pars_fragment:_m,lightmap_pars_fragment:vm,lights_lambert_fragment:ym,lights_lambert_pars_fragment:bm,lights_pars_begin:wm,lights_toon_fragment:Sm,lights_toon_pars_fragment:Am,lights_phong_fragment:Tm,lights_phong_pars_fragment:Em,lights_physical_fragment:Cm,lights_physical_pars_fragment:Rm,lights_fragment_begin:Im,lights_fragment_maps:Pm,lights_fragment_end:Lm,logdepthbuf_fragment:Nm,logdepthbuf_pars_fragment:Dm,logdepthbuf_pars_vertex:Fm,logdepthbuf_vertex:Bm,map_fragment:Um,map_pars_fragment:zm,map_particle_fragment:Om,map_particle_pars_fragment:km,metalnessmap_fragment:Vm,metalnessmap_pars_fragment:Hm,morphinstance_vertex:Gm,morphcolor_vertex:Wm,morphnormal_vertex:qm,morphtarget_pars_vertex:Xm,morphtarget_vertex:Ym,normal_fragment_begin:$m,normal_fragment_maps:Zm,normal_pars_fragment:jm,normal_pars_vertex:Km,normal_vertex:Jm,normalmap_pars_fragment:Qm,clearcoat_normal_fragment_begin:eg,clearcoat_normal_fragment_maps:tg,clearcoat_pars_fragment:ng,iridescence_pars_fragment:ig,opaque_fragment:sg,packing:rg,premultiplied_alpha_fragment:og,project_vertex:ag,dithering_fragment:lg,dithering_pars_fragment:cg,roughnessmap_fragment:hg,roughnessmap_pars_fragment:ug,shadowmap_pars_fragment:dg,shadowmap_pars_vertex:fg,shadowmap_vertex:pg,shadowmask_pars_fragment:mg,skinbase_vertex:gg,skinning_pars_vertex:xg,skinning_vertex:_g,skinnormal_vertex:vg,specularmap_fragment:yg,specularmap_pars_fragment:bg,tonemapping_fragment:wg,tonemapping_pars_fragment:Mg,transmission_fragment:Sg,transmission_pars_fragment:Ag,uv_pars_fragment:Tg,uv_pars_vertex:Eg,uv_vertex:Cg,worldpos_vertex:Rg,background_vert:Ig,background_frag:Pg,backgroundCube_vert:Lg,backgroundCube_frag:Ng,cube_vert:Dg,cube_frag:Fg,depth_vert:Bg,depth_frag:Ug,distanceRGBA_vert:zg,distanceRGBA_frag:Og,equirect_vert:kg,equirect_frag:Vg,linedashed_vert:Hg,linedashed_frag:Gg,meshbasic_vert:Wg,meshbasic_frag:qg,meshlambert_vert:Xg,meshlambert_frag:Yg,meshmatcap_vert:$g,meshmatcap_frag:Zg,meshnormal_vert:jg,meshnormal_frag:Kg,meshphong_vert:Jg,meshphong_frag:Qg,meshphysical_vert:e0,meshphysical_frag:t0,meshtoon_vert:n0,meshtoon_frag:i0,points_vert:s0,points_frag:r0,shadow_vert:o0,shadow_frag:a0,sprite_vert:l0,sprite_frag:c0},ce={common:{diffuse:{value:new Ge(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ze}},envmap:{envMap:{value:null},envMapRotation:{value:new ze},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ze},normalScale:{value:new Ee(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ge(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ge(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0},uvTransform:{value:new ze}},sprite:{diffuse:{value:new Ge(16777215)},opacity:{value:1},center:{value:new Ee(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ze},alphaMap:{value:null},alphaMapTransform:{value:new ze},alphaTest:{value:0}}},Ln={basic:{uniforms:zt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:zt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:zt([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new Ge(0)},specular:{value:new Ge(1118481)},shininess:{value:30}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:zt([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new Ge(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:zt([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:zt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:zt([ce.points,ce.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:zt([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:zt([ce.common,ce.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:zt([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:zt([ce.sprite,ce.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ze}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distanceRGBA:{uniforms:zt([ce.common,ce.displacementmap,{referencePosition:{value:new F},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distanceRGBA_vert,fragmentShader:Ve.distanceRGBA_frag},shadow:{uniforms:zt([ce.lights,ce.fog,{color:{value:new Ge(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};Ln.physical={uniforms:zt([Ln.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ze},clearcoatNormalScale:{value:new Ee(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ze},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ze},sheen:{value:0},sheenColor:{value:new Ge(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ze},transmissionSamplerSize:{value:new Ee},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ze},attenuationDistance:{value:0},attenuationColor:{value:new Ge(0)},specularColor:{value:new Ge(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ze},anisotropyVector:{value:new Ee},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ze}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};var Ba={r:0,b:0,g:0},Oi=new vn,h0=new rt;function u0(r,e,t,n,i,s,o){let l=new Ge(0),c=s===!0?0:1,h,a,u=null,d=0,f=null;function m(y){let v=y.isScene===!0?y.background:null;return v&&v.isTexture&&(v=(y.backgroundBlurriness>0?t:e).get(v)),v}function x(y){let v=!1,T=m(y);T===null?g(l,c):T&&T.isColor&&(g(T,1),v=!0);let A=r.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,o):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(r.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function p(y,v){let T=m(v);T&&(T.isCubeTexture||T.mapping===vr)?(a===void 0&&(a=new ht(new yn(1,1,1),new bn({name:"BackgroundCubeMaterial",uniforms:zi(Ln.backgroundCube.uniforms),vertexShader:Ln.backgroundCube.vertexShader,fragmentShader:Ln.backgroundCube.fragmentShader,side:Gt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),a.geometry.deleteAttribute("normal"),a.geometry.deleteAttribute("uv"),a.onBeforeRender=function(A,C,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(a.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(a)),Oi.copy(v.backgroundRotation),Oi.x*=-1,Oi.y*=-1,Oi.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(Oi.y*=-1,Oi.z*=-1),a.material.uniforms.envMap.value=T,a.material.uniforms.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,a.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,a.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,a.material.uniforms.backgroundRotation.value.setFromMatrix4(h0.makeRotationFromEuler(Oi)),a.material.toneMapped=je.getTransfer(T.colorSpace)!==tt,(u!==T||d!==T.version||f!==r.toneMapping)&&(a.material.needsUpdate=!0,u=T,d=T.version,f=r.toneMapping),a.layers.enableAll(),y.unshift(a,a.geometry,a.material,0,0,null)):T&&T.isTexture&&(h===void 0&&(h=new ht(new Yn(2,2),new bn({name:"BackgroundMaterial",uniforms:zi(Ln.background.uniforms),vertexShader:Ln.background.vertexShader,fragmentShader:Ln.background.fragmentShader,side:Wn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),Object.defineProperty(h.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(h)),h.material.uniforms.t2D.value=T,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.toneMapped=je.getTransfer(T.colorSpace)!==tt,T.matrixAutoUpdate===!0&&T.updateMatrix(),h.material.uniforms.uvTransform.value.copy(T.matrix),(u!==T||d!==T.version||f!==r.toneMapping)&&(h.material.needsUpdate=!0,u=T,d=T.version,f=r.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null))}function g(y,v){y.getRGB(Ba,vc(r)),n.buffers.color.setClear(Ba.r,Ba.g,Ba.b,v,o)}function _(){a!==void 0&&(a.geometry.dispose(),a.material.dispose(),a=void 0),h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0)}return{getClearColor:function(){return l},setClearColor:function(y,v=1){l.set(y),c=v,g(l,c)},getClearAlpha:function(){return c},setClearAlpha:function(y){c=y,g(l,c)},render:x,addToRenderList:p,dispose:_}}function d0(r,e){let t=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null),s=i,o=!1;function l(b,P,B,L,U){let O=!1,D=u(L,B,P);s!==D&&(s=D,h(s.object)),O=f(b,L,B,U),O&&m(b,L,B,U),U!==null&&e.update(U,r.ELEMENT_ARRAY_BUFFER),(O||o)&&(o=!1,v(b,P,B,L),U!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(U).buffer))}function c(){return r.createVertexArray()}function h(b){return r.bindVertexArray(b)}function a(b){return r.deleteVertexArray(b)}function u(b,P,B){let L=B.wireframe===!0,U=n[b.id];U===void 0&&(U={},n[b.id]=U);let O=U[P.id];O===void 0&&(O={},U[P.id]=O);let D=O[L];return D===void 0&&(D=d(c()),O[L]=D),D}function d(b){let P=[],B=[],L=[];for(let U=0;U<t;U++)P[U]=0,B[U]=0,L[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:B,attributeDivisors:L,object:b,attributes:{},index:null}}function f(b,P,B,L){let U=s.attributes,O=P.attributes,D=0,j=B.getAttributes();for(let H in j)if(j[H].location>=0){let ae=U[H],de=O[H];if(de===void 0&&(H==="instanceMatrix"&&b.instanceMatrix&&(de=b.instanceMatrix),H==="instanceColor"&&b.instanceColor&&(de=b.instanceColor)),ae===void 0||ae.attribute!==de||de&&ae.data!==de.data)return!0;D++}return s.attributesNum!==D||s.index!==L}function m(b,P,B,L){let U={},O=P.attributes,D=0,j=B.getAttributes();for(let H in j)if(j[H].location>=0){let ae=O[H];ae===void 0&&(H==="instanceMatrix"&&b.instanceMatrix&&(ae=b.instanceMatrix),H==="instanceColor"&&b.instanceColor&&(ae=b.instanceColor));let de={};de.attribute=ae,ae&&ae.data&&(de.data=ae.data),U[H]=de,D++}s.attributes=U,s.attributesNum=D,s.index=L}function x(){let b=s.newAttributes;for(let P=0,B=b.length;P<B;P++)b[P]=0}function p(b){g(b,0)}function g(b,P){let B=s.newAttributes,L=s.enabledAttributes,U=s.attributeDivisors;B[b]=1,L[b]===0&&(r.enableVertexAttribArray(b),L[b]=1),U[b]!==P&&(r.vertexAttribDivisor(b,P),U[b]=P)}function _(){let b=s.newAttributes,P=s.enabledAttributes;for(let B=0,L=P.length;B<L;B++)P[B]!==b[B]&&(r.disableVertexAttribArray(B),P[B]=0)}function y(b,P,B,L,U,O,D){D===!0?r.vertexAttribIPointer(b,P,B,U,O):r.vertexAttribPointer(b,P,B,L,U,O)}function v(b,P,B,L){x();let U=L.attributes,O=B.getAttributes(),D=P.defaultAttributeValues;for(let j in O){let H=O[j];if(H.location>=0){let Z=U[j];if(Z===void 0&&(j==="instanceMatrix"&&b.instanceMatrix&&(Z=b.instanceMatrix),j==="instanceColor"&&b.instanceColor&&(Z=b.instanceColor)),Z!==void 0){let ae=Z.normalized,de=Z.itemSize,re=e.get(Z);if(re===void 0)continue;let Ze=re.buffer,et=re.type,Ye=re.bytesPerElement,$=et===r.INT||et===r.UNSIGNED_INT||Z.gpuType===ta;if(Z.isInterleavedBufferAttribute){let Q=Z.data,xe=Q.stride,De=Z.offset;if(Q.isInstancedInterleavedBuffer){for(let Te=0;Te<H.locationSize;Te++)g(H.location+Te,Q.meshPerAttribute);b.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let Te=0;Te<H.locationSize;Te++)p(H.location+Te);r.bindBuffer(r.ARRAY_BUFFER,Ze);for(let Te=0;Te<H.locationSize;Te++)y(H.location+Te,de/H.locationSize,et,ae,xe*Ye,(De+de/H.locationSize*Te)*Ye,$)}else{if(Z.isInstancedBufferAttribute){for(let Q=0;Q<H.locationSize;Q++)g(H.location+Q,Z.meshPerAttribute);b.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let Q=0;Q<H.locationSize;Q++)p(H.location+Q);r.bindBuffer(r.ARRAY_BUFFER,Ze);for(let Q=0;Q<H.locationSize;Q++)y(H.location+Q,de/H.locationSize,et,ae,de*Ye,de/H.locationSize*Q*Ye,$)}}else if(D!==void 0){let ae=D[j];if(ae!==void 0)switch(ae.length){case 2:r.vertexAttrib2fv(H.location,ae);break;case 3:r.vertexAttrib3fv(H.location,ae);break;case 4:r.vertexAttrib4fv(H.location,ae);break;default:r.vertexAttrib1fv(H.location,ae)}}}}_()}function T(){R();for(let b in n){let P=n[b];for(let B in P){let L=P[B];for(let U in L)a(L[U].object),delete L[U];delete P[B]}delete n[b]}}function A(b){if(n[b.id]===void 0)return;let P=n[b.id];for(let B in P){let L=P[B];for(let U in L)a(L[U].object),delete L[U];delete P[B]}delete n[b.id]}function C(b){for(let P in n){let B=n[P];if(B[b.id]===void 0)continue;let L=B[b.id];for(let U in L)a(L[U].object),delete L[U];delete B[b.id]}}function R(){M(),o=!0,s!==i&&(s=i,h(s.object))}function M(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:l,reset:R,resetDefaultState:M,dispose:T,releaseStatesOfGeometry:A,releaseStatesOfProgram:C,initAttributes:x,enableAttribute:p,disableUnusedAttributes:_}}function f0(r,e,t){let n;function i(h){n=h}function s(h,a){r.drawArrays(n,h,a),t.update(a,n,1)}function o(h,a,u){u!==0&&(r.drawArraysInstanced(n,h,a,u),t.update(a,n,u))}function l(h,a,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,h,0,a,0,u);let f=0;for(let m=0;m<u;m++)f+=a[m];t.update(f,n,1)}function c(h,a,u,d){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<h.length;m++)o(h[m],a[m],d[m]);else{f.multiDrawArraysInstancedWEBGL(n,h,0,a,0,d,0,u);let m=0;for(let x=0;x<u;x++)m+=a[x]*d[x];t.update(m,n,1)}}this.setMode=i,this.render=s,this.renderInstances=o,this.renderMultiDraw=l,this.renderMultiDrawInstances=c}function p0(r,e,t,n){let i;function s(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");i=r.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(C){return!(C!==cn&&n.convert(C)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function l(C){let R=C===vs&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==wn&&n.convert(C)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Mn&&!R)}function c(C){if(C==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp",a=c(h);a!==h&&(console.warn("THREE.WebGLRenderer:",h,"not supported, using",a,"instead."),h=a);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),m=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=r.getParameter(r.MAX_TEXTURE_SIZE),p=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),g=r.getParameter(r.MAX_VERTEX_ATTRIBS),_=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),y=r.getParameter(r.MAX_VARYING_VECTORS),v=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),T=m>0,A=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:l,precision:h,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:_,maxVaryings:y,maxFragmentUniforms:v,vertexTextures:T,maxSamples:A}}function m0(r){let e=this,t=null,n=0,i=!1,s=!1,o=new Cn,l=new ze,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){s=!0,a(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){t=a(u,d,0)},this.setState=function(u,d,f){let m=u.clippingPlanes,x=u.clipIntersection,p=u.clipShadows,g=r.get(u);if(!i||m===null||m.length===0||s&&!p)s?a(null):h();else{let _=s?0:n,y=_*4,v=g.clippingState||null;c.value=v,v=a(m,d,y,f);for(let T=0;T!==y;++T)v[T]=t[T];g.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function h(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function a(u,d,f,m){let x=u!==null?u.length:0,p=null;if(x!==0){if(p=c.value,m!==!0||p===null){let g=f+x*4,_=d.matrixWorldInverse;l.getNormalMatrix(_),(p===null||p.length<g)&&(p=new Float32Array(g));for(let y=0,v=f;y!==x;++y,v+=4)o.copy(u[y]).applyMatrix4(_,l),o.normal.toArray(p,v),p[v+3]=o.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function g0(r){let e=new WeakMap;function t(o,l){return l===Jo?o.mapping=Bi:l===Qo&&(o.mapping=Ui),o}function n(o){if(o&&o.isTexture){let l=o.mapping;if(l===Jo||l===Qo)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let h=new bo(c.height);return h.fromEquirectangularTexture(r,o),e.set(o,h),o.addEventListener("dispose",i),t(h.texture,o.mapping)}else return null}}return o}function i(o){let l=o.target;l.removeEventListener("dispose",i);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}var Ss=4,Wu=[.125,.215,.35,.446,.526,.582],Hi=20,Sc=new Fi,qu=new Ge,Ac=null,Tc=0,Ec=0,Cc=!1,Vi=(1+Math.sqrt(5))/2,Ms=1/Vi,Xu=[new F(-Vi,Ms,0),new F(Vi,Ms,0),new F(-Ms,0,Vi),new F(Ms,0,Vi),new F(0,Vi,-Ms),new F(0,Vi,Ms),new F(-1,1,-1),new F(1,1,-1),new F(-1,1,1),new F(1,1,1)],x0=new F,Oa=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100,s={}){let{size:o=256,position:l=x0}=s;Ac=this._renderer.getRenderTarget(),Tc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),Cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,i,c,l),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Zu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=$u(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Ac,Tc,Ec),this._renderer.xr.enabled=Cc,e.scissorTest=!1,Ua(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Bi||e.mapping===Ui?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ac=this._renderer.getRenderTarget(),Tc=this._renderer.getActiveCubeFace(),Ec=this._renderer.getActiveMipmapLevel(),Cc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:_n,minFilter:_n,generateMipmaps:!1,type:vs,format:cn,colorSpace:Ii,depthBuffer:!1},i=Yu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Yu(e,t,n);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=_0(s)),this._blurMaterial=v0(s,e,t)}return i}_compileMaterial(e){let t=new ht(this._lodPlanes[0],e);this._renderer.compile(t,Sc)}_sceneToCubeUV(e,t,n,i,s){let c=new Xt(90,1,t,n),h=[1,-1,1,1,1,1],a=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(qu),u.toneMapping=Zn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null));let x=new Ht({name:"PMREM.Background",side:Gt,depthWrite:!1,depthTest:!1}),p=new ht(new yn,x),g=!1,_=e.background;_?_.isColor&&(x.color.copy(_),e.background=null,g=!0):(x.color.copy(qu),g=!0);for(let y=0;y<6;y++){let v=y%3;v===0?(c.up.set(0,h[y],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+a[y],s.y,s.z)):v===1?(c.up.set(0,0,h[y]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+a[y],s.z)):(c.up.set(0,h[y],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+a[y]));let T=this._cubeSize;Ua(i,v*T,y>2?T:0,T,T),u.setRenderTarget(i),g&&u.render(p,c),u.render(e,c)}p.geometry.dispose(),p.material.dispose(),u.toneMapping=f,u.autoClear=d,e.background=_}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===Bi||e.mapping===Ui;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Zu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=$u());let s=i?this._cubemapMaterial:this._equirectMaterial,o=new ht(this._lodPlanes[0],s),l=s.uniforms;l.envMap.value=e;let c=this._cubeSize;Ua(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,Sc)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let i=this._lodPlanes.length;for(let s=1;s<i;s++){let o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),l=Xu[(i-s-1)%Xu.length];this._blur(e,s-1,s,o,l)}t.autoClear=n}_blur(e,t,n,i,s){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",s),this._halfBlur(o,e,n,n,i,"longitudinal",s)}_halfBlur(e,t,n,i,s,o,l){let c=this._renderer,h=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let a=3,u=new ht(this._lodPlanes[i],h),d=h.uniforms,f=this._sizeLods[n]-1,m=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*Hi-1),x=s/m,p=isFinite(s)?1+Math.floor(a*x):Hi;p>Hi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Hi}`);let g=[],_=0;for(let C=0;C<Hi;++C){let R=C/x,M=Math.exp(-R*R/2);g.push(M),C===0?_+=M:C<p&&(_+=2*M)}for(let C=0;C<g.length;C++)g[C]=g[C]/_;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=g,d.latitudinal.value=o==="latitudinal",l&&(d.poleAxis.value=l);let{_lodMax:y}=this;d.dTheta.value=m,d.mipInt.value=y-n;let v=this._sizeLods[i],T=3*v*(i>y-Ss?i-y+Ss:0),A=4*(this._cubeSize-v);Ua(t,T,A,3*v,2*v),c.setRenderTarget(t),c.render(u,Sc)}};function _0(r){let e=[],t=[],n=[],i=r,s=r-Ss+1+Wu.length;for(let o=0;o<s;o++){let l=Math.pow(2,i);t.push(l);let c=1/l;o>r-Ss?c=Wu[o-r+Ss-1]:o===0&&(c=0),n.push(c);let h=1/(l-2),a=-h,u=1+h,d=[a,a,u,a,u,u,a,a,u,u,a,u],f=6,m=6,x=3,p=2,g=1,_=new Float32Array(x*m*f),y=new Float32Array(p*m*f),v=new Float32Array(g*m*f);for(let A=0;A<f;A++){let C=A%3*2/3-1,R=A>2?0:-1,M=[C,R,0,C+2/3,R,0,C+2/3,R+1,0,C,R,0,C+2/3,R+1,0,C,R+1,0];_.set(M,x*m*A),y.set(d,p*m*A);let b=[A,A,A,A,A,A];v.set(b,g*m*A)}let T=new Bt;T.setAttribute("position",new Ft(_,x)),T.setAttribute("uv",new Ft(y,p)),T.setAttribute("faceIndex",new Ft(v,g)),e.push(T),i>Ss&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Yu(r,e,t){let n=new Rn(r,e,t);return n.texture.mapping=vr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ua(r,e,t,n,i){r.viewport.set(e,t,n,i),r.scissor.set(e,t,n,i)}function v0(r,e,t){let n=new Float32Array(Hi),i=new F(0,1,0);return new bn({name:"SphericalGaussianBlur",defines:{n:Hi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:zc(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function $u(){return new bn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:zc(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Zu(){return new bn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:zc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:$n,depthTest:!1,depthWrite:!1})}function zc(){return`

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
	`}function y0(r){let e=new WeakMap,t=null;function n(l){if(l&&l.isTexture){let c=l.mapping,h=c===Jo||c===Qo,a=c===Bi||c===Ui;if(h||a){let u=e.get(l),d=u!==void 0?u.texture.pmremVersion:0;if(l.isRenderTargetTexture&&l.pmremVersion!==d)return t===null&&(t=new Oa(r)),u=h?t.fromEquirectangular(l,u):t.fromCubemap(l,u),u.texture.pmremVersion=l.pmremVersion,e.set(l,u),u.texture;if(u!==void 0)return u.texture;{let f=l.image;return h&&f&&f.height>0||a&&f&&i(f)?(t===null&&(t=new Oa(r)),u=h?t.fromEquirectangular(l):t.fromCubemap(l),u.texture.pmremVersion=l.pmremVersion,e.set(l,u),l.addEventListener("dispose",s),u.texture):null}}}return l}function i(l){let c=0,h=6;for(let a=0;a<h;a++)l[a]!==void 0&&c++;return c===h}function s(l){let c=l.target;c.removeEventListener("dispose",s);let h=e.get(c);h!==void 0&&(e.delete(c),h.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function b0(r){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let i=t(n);return i===null&&us("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function w0(r,e,t,n){let i={},s=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete i[d.id];let f=s.get(d);f&&(e.remove(f),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function l(u,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function c(u){let d=u.attributes;for(let f in d)e.update(d[f],r.ARRAY_BUFFER)}function h(u){let d=[],f=u.index,m=u.attributes.position,x=0;if(f!==null){let _=f.array;x=f.version;for(let y=0,v=_.length;y<v;y+=3){let T=_[y+0],A=_[y+1],C=_[y+2];d.push(T,A,A,C,C,T)}}else if(m!==void 0){let _=m.array;x=m.version;for(let y=0,v=_.length/3-1;y<v;y+=3){let T=y+0,A=y+1,C=y+2;d.push(T,A,A,C,C,T)}}else return;let p=new(_c(d)?tr:er)(d,1);p.version=x;let g=s.get(u);g&&e.remove(g),s.set(u,p)}function a(u){let d=s.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&h(u)}else h(u);return s.get(u)}return{get:l,update:c,getWireframeAttribute:a}}function M0(r,e,t){let n;function i(d){n=d}let s,o;function l(d){s=d.type,o=d.bytesPerElement}function c(d,f){r.drawElements(n,f,s,d*o),t.update(f,n,1)}function h(d,f,m){m!==0&&(r.drawElementsInstanced(n,f,s,d*o,m),t.update(f,n,m))}function a(d,f,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,d,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];t.update(p,n,1)}function u(d,f,m,x){if(m===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<d.length;g++)h(d[g]/o,f[g],x[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,s,d,0,x,0,m);let g=0;for(let _=0;_<m;_++)g+=f[_]*x[_];t.update(g,n,1)}}this.setMode=i,this.setIndex=l,this.render=c,this.renderInstances=h,this.renderMultiDraw=a,this.renderMultiDrawInstances=u}function S0(r){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,l){switch(t.calls++,o){case r.TRIANGLES:t.triangles+=l*(s/3);break;case r.LINES:t.lines+=l*(s/2);break;case r.LINE_STRIP:t.lines+=l*(s-1);break;case r.LINE_LOOP:t.lines+=l*s;break;case r.POINTS:t.points+=l*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function A0(r,e,t){let n=new WeakMap,i=new xt;function s(o,l,c){let h=o.morphTargetInfluences,a=l.morphAttributes.position||l.morphAttributes.normal||l.morphAttributes.color,u=a!==void 0?a.length:0,d=n.get(l);if(d===void 0||d.count!==u){let M=function(){C.dispose(),n.delete(l),l.removeEventListener("dispose",M)};d!==void 0&&d.texture.dispose();let f=l.morphAttributes.position!==void 0,m=l.morphAttributes.normal!==void 0,x=l.morphAttributes.color!==void 0,p=l.morphAttributes.position||[],g=l.morphAttributes.normal||[],_=l.morphAttributes.color||[],y=0;f===!0&&(y=1),m===!0&&(y=2),x===!0&&(y=3);let v=l.attributes.position.count*y,T=1;v>e.maxTextureSize&&(T=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let A=new Float32Array(v*T*4*u),C=new Js(A,v,T,u);C.type=Mn,C.needsUpdate=!0;let R=y*4;for(let b=0;b<u;b++){let P=p[b],B=g[b],L=_[b],U=v*T*4*b;for(let O=0;O<P.count;O++){let D=O*R;f===!0&&(i.fromBufferAttribute(P,O),A[U+D+0]=i.x,A[U+D+1]=i.y,A[U+D+2]=i.z,A[U+D+3]=0),m===!0&&(i.fromBufferAttribute(B,O),A[U+D+4]=i.x,A[U+D+5]=i.y,A[U+D+6]=i.z,A[U+D+7]=0),x===!0&&(i.fromBufferAttribute(L,O),A[U+D+8]=i.x,A[U+D+9]=i.y,A[U+D+10]=i.z,A[U+D+11]=L.itemSize===4?i.w:1)}}d={count:u,texture:C,size:new Ee(v,T)},n.set(l,d),l.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(r,"morphTexture",o.morphTexture,t);else{let f=0;for(let x=0;x<h.length;x++)f+=h[x];let m=l.morphTargetsRelative?1:1-f;c.getUniforms().setValue(r,"morphTargetBaseInfluence",m),c.getUniforms().setValue(r,"morphTargetInfluences",h)}c.getUniforms().setValue(r,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:s}}function T0(r,e,t,n){let i=new WeakMap;function s(c){let h=n.render.frame,a=c.geometry,u=e.get(c,a);if(i.get(u)!==h&&(e.update(u),i.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),i.get(c)!==h&&(t.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,r.ARRAY_BUFFER),i.set(c,h))),c.isSkinnedMesh){let d=c.skeleton;i.get(d)!==h&&(d.update(),i.set(d,h))}return u}function o(){i=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:o}}var pd=new Vt,ju=new ar(1,1),md=new Js,gd=new _o,xd=new ir,Ku=[],Ju=[],Qu=new Float32Array(16),ed=new Float32Array(9),td=new Float32Array(4);function Ts(r,e,t){let n=r[0];if(n<=0||n>0)return r;let i=e*t,s=Ku[i];if(s===void 0&&(s=new Float32Array(i),Ku[i]=s),e!==0){n.toArray(s,0);for(let o=1,l=0;o!==e;++o)l+=t,r[o].toArray(s,l)}return s}function wt(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function Mt(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function Va(r,e){let t=Ju[e];t===void 0&&(t=new Int32Array(e),Ju[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function E0(r,e){let t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function C0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;r.uniform2fv(this.addr,e),Mt(t,e)}}function R0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(wt(t,e))return;r.uniform3fv(this.addr,e),Mt(t,e)}}function I0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;r.uniform4fv(this.addr,e),Mt(t,e)}}function P0(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;td.set(n),r.uniformMatrix2fv(this.addr,!1,td),Mt(t,n)}}function L0(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;ed.set(n),r.uniformMatrix3fv(this.addr,!1,ed),Mt(t,n)}}function N0(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),Mt(t,e)}else{if(wt(t,n))return;Qu.set(n),r.uniformMatrix4fv(this.addr,!1,Qu),Mt(t,n)}}function D0(r,e){let t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function F0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;r.uniform2iv(this.addr,e),Mt(t,e)}}function B0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;r.uniform3iv(this.addr,e),Mt(t,e)}}function U0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;r.uniform4iv(this.addr,e),Mt(t,e)}}function z0(r,e){let t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function O0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;r.uniform2uiv(this.addr,e),Mt(t,e)}}function k0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;r.uniform3uiv(this.addr,e),Mt(t,e)}}function V0(r,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;r.uniform4uiv(this.addr,e),Mt(t,e)}}function H0(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(ju.compareFunction=fc,s=ju):s=pd,t.setTexture2D(e||s,i)}function G0(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||gd,i)}function W0(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||xd,i)}function q0(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||md,i)}function X0(r){switch(r){case 5126:return E0;case 35664:return C0;case 35665:return R0;case 35666:return I0;case 35674:return P0;case 35675:return L0;case 35676:return N0;case 5124:case 35670:return D0;case 35667:case 35671:return F0;case 35668:case 35672:return B0;case 35669:case 35673:return U0;case 5125:return z0;case 36294:return O0;case 36295:return k0;case 36296:return V0;case 35678:case 36198:case 36298:case 36306:case 35682:return H0;case 35679:case 36299:case 36307:return G0;case 35680:case 36300:case 36308:case 36293:return W0;case 36289:case 36303:case 36311:case 36292:return q0}}function Y0(r,e){r.uniform1fv(this.addr,e)}function $0(r,e){let t=Ts(e,this.size,2);r.uniform2fv(this.addr,t)}function Z0(r,e){let t=Ts(e,this.size,3);r.uniform3fv(this.addr,t)}function j0(r,e){let t=Ts(e,this.size,4);r.uniform4fv(this.addr,t)}function K0(r,e){let t=Ts(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function J0(r,e){let t=Ts(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function Q0(r,e){let t=Ts(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function ex(r,e){r.uniform1iv(this.addr,e)}function tx(r,e){r.uniform2iv(this.addr,e)}function nx(r,e){r.uniform3iv(this.addr,e)}function ix(r,e){r.uniform4iv(this.addr,e)}function sx(r,e){r.uniform1uiv(this.addr,e)}function rx(r,e){r.uniform2uiv(this.addr,e)}function ox(r,e){r.uniform3uiv(this.addr,e)}function ax(r,e){r.uniform4uiv(this.addr,e)}function lx(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);wt(n,s)||(r.uniform1iv(this.addr,s),Mt(n,s));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||pd,s[o])}function cx(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);wt(n,s)||(r.uniform1iv(this.addr,s),Mt(n,s));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||gd,s[o])}function hx(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);wt(n,s)||(r.uniform1iv(this.addr,s),Mt(n,s));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||xd,s[o])}function ux(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);wt(n,s)||(r.uniform1iv(this.addr,s),Mt(n,s));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||md,s[o])}function dx(r){switch(r){case 5126:return Y0;case 35664:return $0;case 35665:return Z0;case 35666:return j0;case 35674:return K0;case 35675:return J0;case 35676:return Q0;case 5124:case 35670:return ex;case 35667:case 35671:return tx;case 35668:case 35672:return nx;case 35669:case 35673:return ix;case 5125:return sx;case 36294:return rx;case 36295:return ox;case 36296:return ax;case 35678:case 36198:case 36298:case 36306:case 35682:return lx;case 35679:case 36299:case 36307:return cx;case 35680:case 36300:case 36308:case 36293:return hx;case 36289:case 36303:case 36311:case 36292:return ux}}var Ic=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=X0(t.type)}},Pc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=dx(t.type)}},Lc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let s=0,o=i.length;s!==o;++s){let l=i[s];l.setValue(e,t[l.id],n)}}},Rc=/(\w+)(\])?(\[|\.)?/g;function nd(r,e){r.seq.push(e),r.map[e.id]=e}function fx(r,e,t){let n=r.name,i=n.length;for(Rc.lastIndex=0;;){let s=Rc.exec(n),o=Rc.lastIndex,l=s[1],c=s[2]==="]",h=s[3];if(c&&(l=l|0),h===void 0||h==="["&&o+2===i){nd(t,h===void 0?new Ic(l,r,e):new Pc(l,r,e));break}else{let u=t.map[l];u===void 0&&(u=new Lc(l),nd(t,u)),t=u}}}var As=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let s=e.getActiveUniform(t,i),o=e.getUniformLocation(t,s.name);fx(s,o,this)}}setValue(e,t,n,i){let s=this.map[t];s!==void 0&&s.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let s=0,o=t.length;s!==o;++s){let l=t[s],c=n[l.id];c.needsUpdate!==!1&&l.setValue(e,c.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,s=e.length;i!==s;++i){let o=e[i];o.id in t&&n.push(o)}return n}};function id(r,e,t){let n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}var px=37297,mx=0;function gx(r,e){let t=r.split(`
`),n=[],i=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=i;o<s;o++){let l=o+1;n.push(`${l===e?">":" "} ${l}: ${t[o]}`)}return n.join(`
`)}var sd=new ze;function xx(r){je._getMatrix(sd,je.workingColorSpace,r);let e=`mat3( ${sd.elements.map(t=>t.toFixed(4))} )`;switch(je.getTransfer(r)){case Zs:return[e,"LinearTransferOETF"];case tt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function rd(r,e,t){let n=r.getShaderParameter(e,r.COMPILE_STATUS),s=(r.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let l=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+gx(r.getShaderSource(e),l)}else return s}function _x(r,e){let t=xx(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function vx(r,e){let t;switch(e){case wu:t="Linear";break;case Mu:t="Reinhard";break;case Su:t="Cineon";break;case Ko:t="ACESFilmic";break;case Tu:t="AgX";break;case Eu:t="Neutral";break;case Au:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var za=new F;function yx(){je.getLuminanceCoefficients(za);let r=za.x.toFixed(4),e=za.y.toFixed(4),t=za.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function bx(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ar).join(`
`)}function wx(r){let e=[];for(let t in r){let n=r[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Mx(r,e){let t={},n=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let s=r.getActiveAttrib(e,i),o=s.name,l=1;s.type===r.FLOAT_MAT2&&(l=2),s.type===r.FLOAT_MAT3&&(l=3),s.type===r.FLOAT_MAT4&&(l=4),t[o]={type:s.type,location:r.getAttribLocation(e,o),locationSize:l}}return t}function Ar(r){return r!==""}function od(r,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ad(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Sx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Nc(r){return r.replace(Sx,Tx)}var Ax=new Map;function Tx(r,e){let t=Ve[e];if(t===void 0){let n=Ax.get(e);if(n!==void 0)t=Ve[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Nc(t)}var Ex=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ld(r){return r.replace(Ex,Cx)}function Cx(r,e,t,n){let i="";for(let s=parseInt(e);s<parseInt(t);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function cd(r){let e=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Rx(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Ql?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===Go?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Pn&&(e="SHADOWMAP_TYPE_VSM"),e}function Ix(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case Bi:case Ui:e="ENVMAP_TYPE_CUBE";break;case vr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Px(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case Ui:e="ENVMAP_MODE_REFRACTION";break}return e}function Lx(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case ic:e="ENVMAP_BLENDING_MULTIPLY";break;case yu:e="ENVMAP_BLENDING_MIX";break;case bu:e="ENVMAP_BLENDING_ADD";break}return e}function Nx(r){let e=r.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Dx(r,e,t,n){let i=r.getContext(),s=t.defines,o=t.vertexShader,l=t.fragmentShader,c=Rx(t),h=Ix(t),a=Px(t),u=Lx(t),d=Nx(t),f=bx(t),m=wx(s),x=i.createProgram(),p,g,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Ar).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Ar).join(`
`),g.length>0&&(g+=`
`)):(p=[cd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+a:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ar).join(`
`),g=[cd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+a:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Zn?"#define TONE_MAPPING":"",t.toneMapping!==Zn?Ve.tonemapping_pars_fragment:"",t.toneMapping!==Zn?vx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,_x("linearToOutputTexel",t.outputColorSpace),yx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ar).join(`
`)),o=Nc(o),o=od(o,t),o=ad(o,t),l=Nc(l),l=od(l,t),l=ad(l,t),o=ld(o),l=ld(l),t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",t.glslVersion===mc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===mc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let y=_+p+o,v=_+g+l,T=id(i,i.VERTEX_SHADER,y),A=id(i,i.FRAGMENT_SHADER,v);i.attachShader(x,T),i.attachShader(x,A),t.index0AttributeName!==void 0?i.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(x,0,"position"),i.linkProgram(x);function C(P){if(r.debug.checkShaderErrors){let B=i.getProgramInfoLog(x)||"",L=i.getShaderInfoLog(T)||"",U=i.getShaderInfoLog(A)||"",O=B.trim(),D=L.trim(),j=U.trim(),H=!0,Z=!0;if(i.getProgramParameter(x,i.LINK_STATUS)===!1)if(H=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,x,T,A);else{let ae=rd(i,T,"vertex"),de=rd(i,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(x,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+O+`
`+ae+`
`+de)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):(D===""||j==="")&&(Z=!1);Z&&(P.diagnostics={runnable:H,programLog:O,vertexShader:{log:D,prefix:p},fragmentShader:{log:j,prefix:g}})}i.deleteShader(T),i.deleteShader(A),R=new As(i,x),M=Mx(i,x)}let R;this.getUniforms=function(){return R===void 0&&C(this),R};let M;this.getAttributes=function(){return M===void 0&&C(this),M};let b=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=i.getProgramParameter(x,px)),b},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=mx++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=T,this.fragmentShader=A,this}var Fx=0,Dc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Fc(e),t.set(e,n)),n}},Fc=class{constructor(e){this.id=Fx++,this.code=e,this.usedTimes=0}};function Bx(r,e,t,n,i,s,o){let l=new Qs,c=new Dc,h=new Set,a=[],u=i.logarithmicDepthBuffer,d=i.vertexTextures,f=i.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return h.add(M),M===0?"uv":`uv${M}`}function p(M,b,P,B,L){let U=B.fog,O=L.geometry,D=M.isMeshStandardMaterial?B.environment:null,j=(M.isMeshStandardMaterial?t:e).get(M.envMap||D),H=j&&j.mapping===vr?j.image.height:null,Z=m[M.type];M.precision!==null&&(f=i.getMaxPrecision(M.precision),f!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));let ae=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,de=ae!==void 0?ae.length:0,re=0;O.morphAttributes.position!==void 0&&(re=1),O.morphAttributes.normal!==void 0&&(re=2),O.morphAttributes.color!==void 0&&(re=3);let Ze,et,Ye,$;if(Z){let Je=Ln[Z];Ze=Je.vertexShader,et=Je.fragmentShader}else Ze=M.vertexShader,et=M.fragmentShader,c.update(M),Ye=c.getVertexShaderID(M),$=c.getFragmentShaderID(M);let Q=r.getRenderTarget(),xe=r.state.buffers.depth.getReversed(),De=L.isInstancedMesh===!0,Te=L.isBatchedMesh===!0,$e=!!M.map,Lt=!!M.matcap,N=!!j,dt=!!M.aoMap,Ue=!!M.lightMap,Le=!!M.bumpMap,ye=!!M.normalMap,ft=!!M.displacementMap,be=!!M.emissiveMap,ke=!!M.metalnessMap,At=!!M.roughnessMap,vt=M.anisotropy>0,I=M.clearcoat>0,w=M.dispersion>0,G=M.iridescence>0,Y=M.sheen>0,ee=M.transmission>0,X=vt&&!!M.anisotropyMap,Ae=I&&!!M.clearcoatMap,oe=I&&!!M.clearcoatNormalMap,we=I&&!!M.clearcoatRoughnessMap,Me=G&&!!M.iridescenceMap,ie=G&&!!M.iridescenceThicknessMap,fe=Y&&!!M.sheenColorMap,Pe=Y&&!!M.sheenRoughnessMap,Se=!!M.specularMap,he=!!M.specularColorMap,Oe=!!M.specularIntensityMap,z=ee&&!!M.transmissionMap,se=ee&&!!M.thicknessMap,le=!!M.gradientMap,ge=!!M.alphaMap,te=M.alphaTest>0,K=!!M.alphaHash,ve=!!M.extensions,Be=Zn;M.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Be=r.toneMapping);let ot={shaderID:Z,shaderType:M.type,shaderName:M.name,vertexShader:Ze,fragmentShader:et,defines:M.defines,customVertexShaderID:Ye,customFragmentShaderID:$,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:Te,batchingColor:Te&&L._colorsTexture!==null,instancing:De,instancingColor:De&&L.instanceColor!==null,instancingMorph:De&&L.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Q===null?r.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Ii,alphaToCoverage:!!M.alphaToCoverage,map:$e,matcap:Lt,envMap:N,envMapMode:N&&j.mapping,envMapCubeUVHeight:H,aoMap:dt,lightMap:Ue,bumpMap:Le,normalMap:ye,displacementMap:d&&ft,emissiveMap:be,normalMapObjectSpace:ye&&M.normalMapType===Pu,normalMapTangentSpace:ye&&M.normalMapType===dc,metalnessMap:ke,roughnessMap:At,anisotropy:vt,anisotropyMap:X,clearcoat:I,clearcoatMap:Ae,clearcoatNormalMap:oe,clearcoatRoughnessMap:we,dispersion:w,iridescence:G,iridescenceMap:Me,iridescenceThicknessMap:ie,sheen:Y,sheenColorMap:fe,sheenRoughnessMap:Pe,specularMap:Se,specularColorMap:he,specularIntensityMap:Oe,transmission:ee,transmissionMap:z,thicknessMap:se,gradientMap:le,opaque:M.transparent===!1&&M.blending===Ci&&M.alphaToCoverage===!1,alphaMap:ge,alphaTest:te,alphaHash:K,combine:M.combine,mapUv:$e&&x(M.map.channel),aoMapUv:dt&&x(M.aoMap.channel),lightMapUv:Ue&&x(M.lightMap.channel),bumpMapUv:Le&&x(M.bumpMap.channel),normalMapUv:ye&&x(M.normalMap.channel),displacementMapUv:ft&&x(M.displacementMap.channel),emissiveMapUv:be&&x(M.emissiveMap.channel),metalnessMapUv:ke&&x(M.metalnessMap.channel),roughnessMapUv:At&&x(M.roughnessMap.channel),anisotropyMapUv:X&&x(M.anisotropyMap.channel),clearcoatMapUv:Ae&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:oe&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:we&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Me&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:Pe&&x(M.sheenRoughnessMap.channel),specularMapUv:Se&&x(M.specularMap.channel),specularColorMapUv:he&&x(M.specularColorMap.channel),specularIntensityMapUv:Oe&&x(M.specularIntensityMap.channel),transmissionMapUv:z&&x(M.transmissionMap.channel),thicknessMapUv:se&&x(M.thicknessMap.channel),alphaMapUv:ge&&x(M.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(ye||vt),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!O.attributes.uv&&($e||ge),fog:!!U,useFog:M.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:M.flatShading===!0&&M.wireframe===!1,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:xe,skinning:L.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:re,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:r.shadowMap.enabled&&P.length>0,shadowMapType:r.shadowMap.type,toneMapping:Be,decodeVideoTexture:$e&&M.map.isVideoTexture===!0&&je.getTransfer(M.map.colorSpace)===tt,decodeVideoTextureEmissive:be&&M.emissiveMap.isVideoTexture===!0&&je.getTransfer(M.emissiveMap.colorSpace)===tt,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Ut,flipSided:M.side===Gt,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:ve&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&M.extensions.multiDraw===!0||Te)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return ot.vertexUv1s=h.has(1),ot.vertexUv2s=h.has(2),ot.vertexUv3s=h.has(3),h.clear(),ot}function g(M){let b=[];if(M.shaderID?b.push(M.shaderID):(b.push(M.customVertexShaderID),b.push(M.customFragmentShaderID)),M.defines!==void 0)for(let P in M.defines)b.push(P),b.push(M.defines[P]);return M.isRawShaderMaterial===!1&&(_(b,M),y(b,M),b.push(r.outputColorSpace)),b.push(M.customProgramCacheKey),b.join()}function _(M,b){M.push(b.precision),M.push(b.outputColorSpace),M.push(b.envMapMode),M.push(b.envMapCubeUVHeight),M.push(b.mapUv),M.push(b.alphaMapUv),M.push(b.lightMapUv),M.push(b.aoMapUv),M.push(b.bumpMapUv),M.push(b.normalMapUv),M.push(b.displacementMapUv),M.push(b.emissiveMapUv),M.push(b.metalnessMapUv),M.push(b.roughnessMapUv),M.push(b.anisotropyMapUv),M.push(b.clearcoatMapUv),M.push(b.clearcoatNormalMapUv),M.push(b.clearcoatRoughnessMapUv),M.push(b.iridescenceMapUv),M.push(b.iridescenceThicknessMapUv),M.push(b.sheenColorMapUv),M.push(b.sheenRoughnessMapUv),M.push(b.specularMapUv),M.push(b.specularColorMapUv),M.push(b.specularIntensityMapUv),M.push(b.transmissionMapUv),M.push(b.thicknessMapUv),M.push(b.combine),M.push(b.fogExp2),M.push(b.sizeAttenuation),M.push(b.morphTargetsCount),M.push(b.morphAttributeCount),M.push(b.numDirLights),M.push(b.numPointLights),M.push(b.numSpotLights),M.push(b.numSpotLightMaps),M.push(b.numHemiLights),M.push(b.numRectAreaLights),M.push(b.numDirLightShadows),M.push(b.numPointLightShadows),M.push(b.numSpotLightShadows),M.push(b.numSpotLightShadowsWithMaps),M.push(b.numLightProbes),M.push(b.shadowMapType),M.push(b.toneMapping),M.push(b.numClippingPlanes),M.push(b.numClipIntersection),M.push(b.depthPacking)}function y(M,b){l.disableAll(),b.supportsVertexTextures&&l.enable(0),b.instancing&&l.enable(1),b.instancingColor&&l.enable(2),b.instancingMorph&&l.enable(3),b.matcap&&l.enable(4),b.envMap&&l.enable(5),b.normalMapObjectSpace&&l.enable(6),b.normalMapTangentSpace&&l.enable(7),b.clearcoat&&l.enable(8),b.iridescence&&l.enable(9),b.alphaTest&&l.enable(10),b.vertexColors&&l.enable(11),b.vertexAlphas&&l.enable(12),b.vertexUv1s&&l.enable(13),b.vertexUv2s&&l.enable(14),b.vertexUv3s&&l.enable(15),b.vertexTangents&&l.enable(16),b.anisotropy&&l.enable(17),b.alphaHash&&l.enable(18),b.batching&&l.enable(19),b.dispersion&&l.enable(20),b.batchingColor&&l.enable(21),b.gradientMap&&l.enable(22),M.push(l.mask),l.disableAll(),b.fog&&l.enable(0),b.useFog&&l.enable(1),b.flatShading&&l.enable(2),b.logarithmicDepthBuffer&&l.enable(3),b.reversedDepthBuffer&&l.enable(4),b.skinning&&l.enable(5),b.morphTargets&&l.enable(6),b.morphNormals&&l.enable(7),b.morphColors&&l.enable(8),b.premultipliedAlpha&&l.enable(9),b.shadowMapEnabled&&l.enable(10),b.doubleSided&&l.enable(11),b.flipSided&&l.enable(12),b.useDepthPacking&&l.enable(13),b.dithering&&l.enable(14),b.transmission&&l.enable(15),b.sheen&&l.enable(16),b.opaque&&l.enable(17),b.pointsUvs&&l.enable(18),b.decodeVideoTexture&&l.enable(19),b.decodeVideoTextureEmissive&&l.enable(20),b.alphaToCoverage&&l.enable(21),M.push(l.mask)}function v(M){let b=m[M.type],P;if(b){let B=Ln[b];P=Hu.clone(B.uniforms)}else P=M.uniforms;return P}function T(M,b){let P;for(let B=0,L=a.length;B<L;B++){let U=a[B];if(U.cacheKey===b){P=U,++P.usedTimes;break}}return P===void 0&&(P=new Dx(r,b,M,s),a.push(P)),P}function A(M){if(--M.usedTimes===0){let b=a.indexOf(M);a[b]=a[a.length-1],a.pop(),M.destroy()}}function C(M){c.remove(M)}function R(){c.dispose()}return{getParameters:p,getProgramCacheKey:g,getUniforms:v,acquireProgram:T,releaseProgram:A,releaseShaderCache:C,programs:a,dispose:R}}function Ux(){let r=new WeakMap;function e(o){return r.has(o)}function t(o){let l=r.get(o);return l===void 0&&(l={},r.set(o,l)),l}function n(o){r.delete(o)}function i(o,l,c){r.get(o)[l]=c}function s(){r=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:s}}function zx(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function hd(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function ud(){let r=[],e=0,t=[],n=[],i=[];function s(){e=0,t.length=0,n.length=0,i.length=0}function o(u,d,f,m,x,p){let g=r[e];return g===void 0?(g={id:u.id,object:u,geometry:d,material:f,groupOrder:m,renderOrder:u.renderOrder,z:x,group:p},r[e]=g):(g.id=u.id,g.object=u,g.geometry=d,g.material=f,g.groupOrder=m,g.renderOrder=u.renderOrder,g.z=x,g.group=p),e++,g}function l(u,d,f,m,x,p){let g=o(u,d,f,m,x,p);f.transmission>0?n.push(g):f.transparent===!0?i.push(g):t.push(g)}function c(u,d,f,m,x,p){let g=o(u,d,f,m,x,p);f.transmission>0?n.unshift(g):f.transparent===!0?i.unshift(g):t.unshift(g)}function h(u,d){t.length>1&&t.sort(u||zx),n.length>1&&n.sort(d||hd),i.length>1&&i.sort(d||hd)}function a(){for(let u=e,d=r.length;u<d;u++){let f=r[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:i,init:s,push:l,unshift:c,finish:a,sort:h}}function Ox(){let r=new WeakMap;function e(n,i){let s=r.get(n),o;return s===void 0?(o=new ud,r.set(n,[o])):i>=s.length?(o=new ud,s.push(o)):o=s[i],o}function t(){r=new WeakMap}return{get:e,dispose:t}}function kx(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new F,color:new Ge};break;case"SpotLight":t={position:new F,direction:new F,color:new Ge,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new F,color:new Ge,distance:0,decay:0};break;case"HemisphereLight":t={direction:new F,skyColor:new Ge,groundColor:new Ge};break;case"RectAreaLight":t={color:new Ge,position:new F,halfWidth:new F,halfHeight:new F};break}return r[e.id]=t,t}}}function Vx(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ee,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}var Hx=0;function Gx(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function Wx(r){let e=new kx,t=Vx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new F);let i=new F,s=new rt,o=new rt;function l(h){let a=0,u=0,d=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let f=0,m=0,x=0,p=0,g=0,_=0,y=0,v=0,T=0,A=0,C=0;h.sort(Gx);for(let M=0,b=h.length;M<b;M++){let P=h[M],B=P.color,L=P.intensity,U=P.distance,O=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)a+=B.r*L,u+=B.g*L,d+=B.b*L;else if(P.isLightProbe){for(let D=0;D<9;D++)n.probe[D].addScaledVector(P.sh.coefficients[D],L);C++}else if(P.isDirectionalLight){let D=e.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let j=P.shadow,H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,n.directionalShadow[f]=H,n.directionalShadowMap[f]=O,n.directionalShadowMatrix[f]=P.shadow.matrix,_++}n.directional[f]=D,f++}else if(P.isSpotLight){let D=e.get(P);D.position.setFromMatrixPosition(P.matrixWorld),D.color.copy(B).multiplyScalar(L),D.distance=U,D.coneCos=Math.cos(P.angle),D.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),D.decay=P.decay,n.spot[x]=D;let j=P.shadow;if(P.map&&(n.spotLightMap[T]=P.map,T++,j.updateMatrices(P),P.castShadow&&A++),n.spotLightMatrix[x]=j.matrix,P.castShadow){let H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,n.spotShadow[x]=H,n.spotShadowMap[x]=O,v++}x++}else if(P.isRectAreaLight){let D=e.get(P);D.color.copy(B).multiplyScalar(L),D.halfWidth.set(P.width*.5,0,0),D.halfHeight.set(0,P.height*.5,0),n.rectArea[p]=D,p++}else if(P.isPointLight){let D=e.get(P);if(D.color.copy(P.color).multiplyScalar(P.intensity),D.distance=P.distance,D.decay=P.decay,P.castShadow){let j=P.shadow,H=t.get(P);H.shadowIntensity=j.intensity,H.shadowBias=j.bias,H.shadowNormalBias=j.normalBias,H.shadowRadius=j.radius,H.shadowMapSize=j.mapSize,H.shadowCameraNear=j.camera.near,H.shadowCameraFar=j.camera.far,n.pointShadow[m]=H,n.pointShadowMap[m]=O,n.pointShadowMatrix[m]=P.shadow.matrix,y++}n.point[m]=D,m++}else if(P.isHemisphereLight){let D=e.get(P);D.skyColor.copy(P.color).multiplyScalar(L),D.groundColor.copy(P.groundColor).multiplyScalar(L),n.hemi[g]=D,g++}}p>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ce.LTC_FLOAT_1,n.rectAreaLTC2=ce.LTC_FLOAT_2):(n.rectAreaLTC1=ce.LTC_HALF_1,n.rectAreaLTC2=ce.LTC_HALF_2)),n.ambient[0]=a,n.ambient[1]=u,n.ambient[2]=d;let R=n.hash;(R.directionalLength!==f||R.pointLength!==m||R.spotLength!==x||R.rectAreaLength!==p||R.hemiLength!==g||R.numDirectionalShadows!==_||R.numPointShadows!==y||R.numSpotShadows!==v||R.numSpotMaps!==T||R.numLightProbes!==C)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=v+T-A,n.spotLightMap.length=T,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=C,R.directionalLength=f,R.pointLength=m,R.spotLength=x,R.rectAreaLength=p,R.hemiLength=g,R.numDirectionalShadows=_,R.numPointShadows=y,R.numSpotShadows=v,R.numSpotMaps=T,R.numLightProbes=C,n.version=Hx++)}function c(h,a){let u=0,d=0,f=0,m=0,x=0,p=a.matrixWorldInverse;for(let g=0,_=h.length;g<_;g++){let y=h[g];if(y.isDirectionalLight){let v=n.directional[u];v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),u++}else if(y.isSpotLight){let v=n.spot[f];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),v.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(p),f++}else if(y.isRectAreaLight){let v=n.rectArea[m];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),o.identity(),s.copy(y.matrixWorld),s.premultiply(p),o.extractRotation(s),v.halfWidth.set(y.width*.5,0,0),v.halfHeight.set(0,y.height*.5,0),v.halfWidth.applyMatrix4(o),v.halfHeight.applyMatrix4(o),m++}else if(y.isPointLight){let v=n.point[d];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(p),d++}else if(y.isHemisphereLight){let v=n.hemi[x];v.direction.setFromMatrixPosition(y.matrixWorld),v.direction.transformDirection(p),x++}}}return{setup:l,setupView:c,state:n}}function dd(r){let e=new Wx(r),t=[],n=[];function i(a){h.camera=a,t.length=0,n.length=0}function s(a){t.push(a)}function o(a){n.push(a)}function l(){e.setup(t)}function c(a){e.setupView(t,a)}let h={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:h,setupLights:l,setupLightsView:c,pushLight:s,pushShadow:o}}function qx(r){let e=new WeakMap;function t(i,s=0){let o=e.get(i),l;return o===void 0?(l=new dd(r),e.set(i,[l])):s>=o.length?(l=new dd(r),o.push(l)):l=o[s],l}function n(){e=new WeakMap}return{get:t,dispose:n}}var Xx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Yx=`uniform sampler2D shadow_pass;
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
}`;function $x(r,e,t){let n=new ms,i=new Ee,s=new Ee,o=new xt,l=new Po({depthPacking:Iu}),c=new Lo,h={},a=t.maxTextureSize,u={[Wn]:Gt,[Gt]:Wn,[Ut]:Ut},d=new bn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ee},radius:{value:4}},vertexShader:Xx,fragmentShader:Yx}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Bt;m.setAttribute("position",new Ft(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ht(m,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ql;let g=this.type;this.render=function(A,C,R){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;let M=r.getRenderTarget(),b=r.getActiveCubeFace(),P=r.getActiveMipmapLevel(),B=r.state;B.setBlending($n),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let L=g!==Pn&&this.type===Pn,U=g===Pn&&this.type!==Pn;for(let O=0,D=A.length;O<D;O++){let j=A[O],H=j.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",j,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;i.copy(H.mapSize);let Z=H.getFrameExtents();if(i.multiply(Z),s.copy(H.mapSize),(i.x>a||i.y>a)&&(i.x>a&&(s.x=Math.floor(a/Z.x),i.x=s.x*Z.x,H.mapSize.x=s.x),i.y>a&&(s.y=Math.floor(a/Z.y),i.y=s.y*Z.y,H.mapSize.y=s.y)),H.map===null||L===!0||U===!0){let de=this.type!==Pn?{minFilter:Yt,magFilter:Yt}:{};H.map!==null&&H.map.dispose(),H.map=new Rn(i.x,i.y,de),H.map.texture.name=j.name+".shadowMap",H.camera.updateProjectionMatrix()}r.setRenderTarget(H.map),r.clear();let ae=H.getViewportCount();for(let de=0;de<ae;de++){let re=H.getViewport(de);o.set(s.x*re.x,s.y*re.y,s.x*re.z,s.y*re.w),B.viewport(o),H.updateMatrices(j,de),n=H.getFrustum(),v(C,R,H.camera,j,this.type)}H.isPointLightShadow!==!0&&this.type===Pn&&_(H,R),H.needsUpdate=!1}g=this.type,p.needsUpdate=!1,r.setRenderTarget(M,b,P)};function _(A,C){let R=e.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Rn(i.x,i.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,r.setRenderTarget(A.mapPass),r.clear(),r.renderBufferDirect(C,null,R,d,x,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,r.setRenderTarget(A.map),r.clear(),r.renderBufferDirect(C,null,R,f,x,null)}function y(A,C,R,M){let b=null,P=R.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(P!==void 0)b=P;else if(b=R.isPointLight===!0?c:l,r.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let B=b.uuid,L=C.uuid,U=h[B];U===void 0&&(U={},h[B]=U);let O=U[L];O===void 0&&(O=b.clone(),U[L]=O,C.addEventListener("dispose",T)),b=O}if(b.visible=C.visible,b.wireframe=C.wireframe,M===Pn?b.side=C.shadowSide!==null?C.shadowSide:C.side:b.side=C.shadowSide!==null?C.shadowSide:u[C.side],b.alphaMap=C.alphaMap,b.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,b.map=C.map,b.clipShadows=C.clipShadows,b.clippingPlanes=C.clippingPlanes,b.clipIntersection=C.clipIntersection,b.displacementMap=C.displacementMap,b.displacementScale=C.displacementScale,b.displacementBias=C.displacementBias,b.wireframeLinewidth=C.wireframeLinewidth,b.linewidth=C.linewidth,R.isPointLight===!0&&b.isMeshDistanceMaterial===!0){let B=r.properties.get(b);B.light=R}return b}function v(A,C,R,M,b){if(A.visible===!1)return;if(A.layers.test(C.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&b===Pn)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,A.matrixWorld);let L=e.update(A),U=A.material;if(Array.isArray(U)){let O=L.groups;for(let D=0,j=O.length;D<j;D++){let H=O[D],Z=U[H.materialIndex];if(Z&&Z.visible){let ae=y(A,Z,M,b);A.onBeforeShadow(r,A,C,R,L,ae,H),r.renderBufferDirect(R,null,L,ae,A,H),A.onAfterShadow(r,A,C,R,L,ae,H)}}}else if(U.visible){let O=y(A,U,M,b);A.onBeforeShadow(r,A,C,R,L,O,null),r.renderBufferDirect(R,null,L,O,A,null),A.onAfterShadow(r,A,C,R,L,O,null)}}let B=A.children;for(let L=0,U=B.length;L<U;L++)v(B[L],C,R,M,b)}function T(A){A.target.removeEventListener("dispose",T);for(let R in h){let M=h[R],b=A.target.uuid;b in M&&(M[b].dispose(),delete M[b])}}}var Zx={[Wo]:qo,[Xo]:Zo,[Yo]:jo,[Ri]:$o,[qo]:Wo,[Zo]:Xo,[jo]:Yo,[$o]:Ri};function jx(r,e){function t(){let z=!1,se=new xt,le=null,ge=new xt(0,0,0,0);return{setMask:function(te){le!==te&&!z&&(r.colorMask(te,te,te,te),le=te)},setLocked:function(te){z=te},setClear:function(te,K,ve,Be,ot){ot===!0&&(te*=Be,K*=Be,ve*=Be),se.set(te,K,ve,Be),ge.equals(se)===!1&&(r.clearColor(te,K,ve,Be),ge.copy(se))},reset:function(){z=!1,le=null,ge.set(-1,0,0,0)}}}function n(){let z=!1,se=!1,le=null,ge=null,te=null;return{setReversed:function(K){if(se!==K){let ve=e.get("EXT_clip_control");K?ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.ZERO_TO_ONE_EXT):ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.NEGATIVE_ONE_TO_ONE_EXT),se=K;let Be=te;te=null,this.setClear(Be)}},getReversed:function(){return se},setTest:function(K){K?Q(r.DEPTH_TEST):xe(r.DEPTH_TEST)},setMask:function(K){le!==K&&!z&&(r.depthMask(K),le=K)},setFunc:function(K){if(se&&(K=Zx[K]),ge!==K){switch(K){case Wo:r.depthFunc(r.NEVER);break;case qo:r.depthFunc(r.ALWAYS);break;case Xo:r.depthFunc(r.LESS);break;case Ri:r.depthFunc(r.LEQUAL);break;case Yo:r.depthFunc(r.EQUAL);break;case $o:r.depthFunc(r.GEQUAL);break;case Zo:r.depthFunc(r.GREATER);break;case jo:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}ge=K}},setLocked:function(K){z=K},setClear:function(K){te!==K&&(se&&(K=1-K),r.clearDepth(K),te=K)},reset:function(){z=!1,le=null,ge=null,te=null,se=!1}}}function i(){let z=!1,se=null,le=null,ge=null,te=null,K=null,ve=null,Be=null,ot=null;return{setTest:function(Je){z||(Je?Q(r.STENCIL_TEST):xe(r.STENCIL_TEST))},setMask:function(Je){se!==Je&&!z&&(r.stencilMask(Je),se=Je)},setFunc:function(Je,Un,En){(le!==Je||ge!==Un||te!==En)&&(r.stencilFunc(Je,Un,En),le=Je,ge=Un,te=En)},setOp:function(Je,Un,En){(K!==Je||ve!==Un||Be!==En)&&(r.stencilOp(Je,Un,En),K=Je,ve=Un,Be=En)},setLocked:function(Je){z=Je},setClear:function(Je){ot!==Je&&(r.clearStencil(Je),ot=Je)},reset:function(){z=!1,se=null,le=null,ge=null,te=null,K=null,ve=null,Be=null,ot=null}}}let s=new t,o=new n,l=new i,c=new WeakMap,h=new WeakMap,a={},u={},d=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,y=null,v=null,T=null,A=null,C=new Ge(0,0,0),R=0,M=!1,b=null,P=null,B=null,L=null,U=null,O=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS),D=!1,j=0,H=r.getParameter(r.VERSION);H.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(H)[1]),D=j>=1):H.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),D=j>=2);let Z=null,ae={},de=r.getParameter(r.SCISSOR_BOX),re=r.getParameter(r.VIEWPORT),Ze=new xt().fromArray(de),et=new xt().fromArray(re);function Ye(z,se,le,ge){let te=new Uint8Array(4),K=r.createTexture();r.bindTexture(z,K),r.texParameteri(z,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(z,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let ve=0;ve<le;ve++)z===r.TEXTURE_3D||z===r.TEXTURE_2D_ARRAY?r.texImage3D(se,0,r.RGBA,1,1,ge,0,r.RGBA,r.UNSIGNED_BYTE,te):r.texImage2D(se+ve,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,te);return K}let $={};$[r.TEXTURE_2D]=Ye(r.TEXTURE_2D,r.TEXTURE_2D,1),$[r.TEXTURE_CUBE_MAP]=Ye(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[r.TEXTURE_2D_ARRAY]=Ye(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),$[r.TEXTURE_3D]=Ye(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),l.setClear(0),Q(r.DEPTH_TEST),o.setFunc(Ri),Le(!1),ye(Jl),Q(r.CULL_FACE),dt($n);function Q(z){a[z]!==!0&&(r.enable(z),a[z]=!0)}function xe(z){a[z]!==!1&&(r.disable(z),a[z]=!1)}function De(z,se){return u[z]!==se?(r.bindFramebuffer(z,se),u[z]=se,z===r.DRAW_FRAMEBUFFER&&(u[r.FRAMEBUFFER]=se),z===r.FRAMEBUFFER&&(u[r.DRAW_FRAMEBUFFER]=se),!0):!1}function Te(z,se){let le=f,ge=!1;if(z){le=d.get(se),le===void 0&&(le=[],d.set(se,le));let te=z.textures;if(le.length!==te.length||le[0]!==r.COLOR_ATTACHMENT0){for(let K=0,ve=te.length;K<ve;K++)le[K]=r.COLOR_ATTACHMENT0+K;le.length=te.length,ge=!0}}else le[0]!==r.BACK&&(le[0]=r.BACK,ge=!0);ge&&r.drawBuffers(le)}function $e(z){return m!==z?(r.useProgram(z),m=z,!0):!1}let Lt={[ci]:r.FUNC_ADD,[iu]:r.FUNC_SUBTRACT,[su]:r.FUNC_REVERSE_SUBTRACT};Lt[ru]=r.MIN,Lt[ou]=r.MAX;let N={[au]:r.ZERO,[lu]:r.ONE,[cu]:r.SRC_COLOR,[ho]:r.SRC_ALPHA,[mu]:r.SRC_ALPHA_SATURATE,[fu]:r.DST_COLOR,[uu]:r.DST_ALPHA,[hu]:r.ONE_MINUS_SRC_COLOR,[uo]:r.ONE_MINUS_SRC_ALPHA,[pu]:r.ONE_MINUS_DST_COLOR,[du]:r.ONE_MINUS_DST_ALPHA,[gu]:r.CONSTANT_COLOR,[xu]:r.ONE_MINUS_CONSTANT_COLOR,[_u]:r.CONSTANT_ALPHA,[vu]:r.ONE_MINUS_CONSTANT_ALPHA};function dt(z,se,le,ge,te,K,ve,Be,ot,Je){if(z===$n){x===!0&&(xe(r.BLEND),x=!1);return}if(x===!1&&(Q(r.BLEND),x=!0),z!==nu){if(z!==p||Je!==M){if((g!==ci||v!==ci)&&(r.blendEquation(r.FUNC_ADD),g=ci,v=ci),Je)switch(z){case Ci:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case ec:r.blendFunc(r.ONE,r.ONE);break;case tc:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case nc:r.blendFuncSeparate(r.DST_COLOR,r.ONE_MINUS_SRC_ALPHA,r.ZERO,r.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}else switch(z){case Ci:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case ec:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE,r.ONE,r.ONE);break;case tc:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case nc:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",z);break}_=null,y=null,T=null,A=null,C.set(0,0,0),R=0,p=z,M=Je}return}te=te||se,K=K||le,ve=ve||ge,(se!==g||te!==v)&&(r.blendEquationSeparate(Lt[se],Lt[te]),g=se,v=te),(le!==_||ge!==y||K!==T||ve!==A)&&(r.blendFuncSeparate(N[le],N[ge],N[K],N[ve]),_=le,y=ge,T=K,A=ve),(Be.equals(C)===!1||ot!==R)&&(r.blendColor(Be.r,Be.g,Be.b,ot),C.copy(Be),R=ot),p=z,M=!1}function Ue(z,se){z.side===Ut?xe(r.CULL_FACE):Q(r.CULL_FACE);let le=z.side===Gt;se&&(le=!le),Le(le),z.blending===Ci&&z.transparent===!1?dt($n):dt(z.blending,z.blendEquation,z.blendSrc,z.blendDst,z.blendEquationAlpha,z.blendSrcAlpha,z.blendDstAlpha,z.blendColor,z.blendAlpha,z.premultipliedAlpha),o.setFunc(z.depthFunc),o.setTest(z.depthTest),o.setMask(z.depthWrite),s.setMask(z.colorWrite);let ge=z.stencilWrite;l.setTest(ge),ge&&(l.setMask(z.stencilWriteMask),l.setFunc(z.stencilFunc,z.stencilRef,z.stencilFuncMask),l.setOp(z.stencilFail,z.stencilZFail,z.stencilZPass)),be(z.polygonOffset,z.polygonOffsetFactor,z.polygonOffsetUnits),z.alphaToCoverage===!0?Q(r.SAMPLE_ALPHA_TO_COVERAGE):xe(r.SAMPLE_ALPHA_TO_COVERAGE)}function Le(z){b!==z&&(z?r.frontFace(r.CW):r.frontFace(r.CCW),b=z)}function ye(z){z!==eu?(Q(r.CULL_FACE),z!==P&&(z===Jl?r.cullFace(r.BACK):z===tu?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):xe(r.CULL_FACE),P=z}function ft(z){z!==B&&(D&&r.lineWidth(z),B=z)}function be(z,se,le){z?(Q(r.POLYGON_OFFSET_FILL),(L!==se||U!==le)&&(r.polygonOffset(se,le),L=se,U=le)):xe(r.POLYGON_OFFSET_FILL)}function ke(z){z?Q(r.SCISSOR_TEST):xe(r.SCISSOR_TEST)}function At(z){z===void 0&&(z=r.TEXTURE0+O-1),Z!==z&&(r.activeTexture(z),Z=z)}function vt(z,se,le){le===void 0&&(Z===null?le=r.TEXTURE0+O-1:le=Z);let ge=ae[le];ge===void 0&&(ge={type:void 0,texture:void 0},ae[le]=ge),(ge.type!==z||ge.texture!==se)&&(Z!==le&&(r.activeTexture(le),Z=le),r.bindTexture(z,se||$[z]),ge.type=z,ge.texture=se)}function I(){let z=ae[Z];z!==void 0&&z.type!==void 0&&(r.bindTexture(z.type,null),z.type=void 0,z.texture=void 0)}function w(){try{r.compressedTexImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function G(){try{r.compressedTexImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Y(){try{r.texSubImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ee(){try{r.texSubImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function X(){try{r.compressedTexSubImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Ae(){try{r.compressedTexSubImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function oe(){try{r.texStorage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function we(){try{r.texStorage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function Me(){try{r.texImage2D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function ie(){try{r.texImage3D(...arguments)}catch(z){console.error("THREE.WebGLState:",z)}}function fe(z){Ze.equals(z)===!1&&(r.scissor(z.x,z.y,z.z,z.w),Ze.copy(z))}function Pe(z){et.equals(z)===!1&&(r.viewport(z.x,z.y,z.z,z.w),et.copy(z))}function Se(z,se){let le=h.get(se);le===void 0&&(le=new WeakMap,h.set(se,le));let ge=le.get(z);ge===void 0&&(ge=r.getUniformBlockIndex(se,z.name),le.set(z,ge))}function he(z,se){let ge=h.get(se).get(z);c.get(se)!==ge&&(r.uniformBlockBinding(se,ge,z.__bindingPointIndex),c.set(se,ge))}function Oe(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),o.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),a={},Z=null,ae={},u={},d=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,y=null,v=null,T=null,A=null,C=new Ge(0,0,0),R=0,M=!1,b=null,P=null,B=null,L=null,U=null,Ze.set(0,0,r.canvas.width,r.canvas.height),et.set(0,0,r.canvas.width,r.canvas.height),s.reset(),o.reset(),l.reset()}return{buffers:{color:s,depth:o,stencil:l},enable:Q,disable:xe,bindFramebuffer:De,drawBuffers:Te,useProgram:$e,setBlending:dt,setMaterial:Ue,setFlipSided:Le,setCullFace:ye,setLineWidth:ft,setPolygonOffset:be,setScissorTest:ke,activeTexture:At,bindTexture:vt,unbindTexture:I,compressedTexImage2D:w,compressedTexImage3D:G,texImage2D:Me,texImage3D:ie,updateUBOMapping:Se,uniformBlockBinding:he,texStorage2D:oe,texStorage3D:we,texSubImage2D:Y,texSubImage3D:ee,compressedTexSubImage2D:X,compressedTexSubImage3D:Ae,scissor:fe,viewport:Pe,reset:Oe}}function Kx(r,e,t,n,i,s,o){let l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new Ee,a=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(I,w){return f?new OffscreenCanvas(I,w):Ks("canvas")}function x(I,w,G){let Y=1,ee=vt(I);if((ee.width>G||ee.height>G)&&(Y=G/Math.max(ee.width,ee.height)),Y<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let X=Math.floor(Y*ee.width),Ae=Math.floor(Y*ee.height);u===void 0&&(u=m(X,Ae));let oe=w?m(X,Ae):u;return oe.width=X,oe.height=Ae,oe.getContext("2d").drawImage(I,0,0,X,Ae),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+X+"x"+Ae+")."),oe}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),I;return I}function p(I){return I.generateMipmaps}function g(I){r.generateMipmap(I)}function _(I){return I.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?r.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function y(I,w,G,Y,ee=!1){if(I!==null){if(r[I]!==void 0)return r[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let X=w;if(w===r.RED&&(G===r.FLOAT&&(X=r.R32F),G===r.HALF_FLOAT&&(X=r.R16F),G===r.UNSIGNED_BYTE&&(X=r.R8)),w===r.RED_INTEGER&&(G===r.UNSIGNED_BYTE&&(X=r.R8UI),G===r.UNSIGNED_SHORT&&(X=r.R16UI),G===r.UNSIGNED_INT&&(X=r.R32UI),G===r.BYTE&&(X=r.R8I),G===r.SHORT&&(X=r.R16I),G===r.INT&&(X=r.R32I)),w===r.RG&&(G===r.FLOAT&&(X=r.RG32F),G===r.HALF_FLOAT&&(X=r.RG16F),G===r.UNSIGNED_BYTE&&(X=r.RG8)),w===r.RG_INTEGER&&(G===r.UNSIGNED_BYTE&&(X=r.RG8UI),G===r.UNSIGNED_SHORT&&(X=r.RG16UI),G===r.UNSIGNED_INT&&(X=r.RG32UI),G===r.BYTE&&(X=r.RG8I),G===r.SHORT&&(X=r.RG16I),G===r.INT&&(X=r.RG32I)),w===r.RGB_INTEGER&&(G===r.UNSIGNED_BYTE&&(X=r.RGB8UI),G===r.UNSIGNED_SHORT&&(X=r.RGB16UI),G===r.UNSIGNED_INT&&(X=r.RGB32UI),G===r.BYTE&&(X=r.RGB8I),G===r.SHORT&&(X=r.RGB16I),G===r.INT&&(X=r.RGB32I)),w===r.RGBA_INTEGER&&(G===r.UNSIGNED_BYTE&&(X=r.RGBA8UI),G===r.UNSIGNED_SHORT&&(X=r.RGBA16UI),G===r.UNSIGNED_INT&&(X=r.RGBA32UI),G===r.BYTE&&(X=r.RGBA8I),G===r.SHORT&&(X=r.RGBA16I),G===r.INT&&(X=r.RGBA32I)),w===r.RGB&&(G===r.UNSIGNED_INT_5_9_9_9_REV&&(X=r.RGB9_E5),G===r.UNSIGNED_INT_10F_11F_11F_REV&&(X=r.R11F_G11F_B10F)),w===r.RGBA){let Ae=ee?Zs:je.getTransfer(Y);G===r.FLOAT&&(X=r.RGBA32F),G===r.HALF_FLOAT&&(X=r.RGBA16F),G===r.UNSIGNED_BYTE&&(X=Ae===tt?r.SRGB8_ALPHA8:r.RGBA8),G===r.UNSIGNED_SHORT_4_4_4_4&&(X=r.RGBA4),G===r.UNSIGNED_SHORT_5_5_5_1&&(X=r.RGB5_A1)}return(X===r.R16F||X===r.R32F||X===r.RG16F||X===r.RG32F||X===r.RGBA16F||X===r.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function v(I,w){let G;return I?w===null||w===mi||w===ys?G=r.DEPTH24_STENCIL8:w===Mn?G=r.DEPTH32F_STENCIL8:w===_s&&(G=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===mi||w===ys?G=r.DEPTH_COMPONENT24:w===Mn?G=r.DEPTH_COMPONENT32F:w===_s&&(G=r.DEPTH_COMPONENT16),G}function T(I,w){return p(I)===!0||I.isFramebufferTexture&&I.minFilter!==Yt&&I.minFilter!==_n?Math.log2(Math.max(w.width,w.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?w.mipmaps.length:1}function A(I){let w=I.target;w.removeEventListener("dispose",A),R(w),w.isVideoTexture&&a.delete(w)}function C(I){let w=I.target;w.removeEventListener("dispose",C),b(w)}function R(I){let w=n.get(I);if(w.__webglInit===void 0)return;let G=I.source,Y=d.get(G);if(Y){let ee=Y[w.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&M(I),Object.keys(Y).length===0&&d.delete(G)}n.remove(I)}function M(I){let w=n.get(I);r.deleteTexture(w.__webglTexture);let G=I.source,Y=d.get(G);delete Y[w.__cacheKey],o.memory.textures--}function b(I){let w=n.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),n.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(w.__webglFramebuffer[Y]))for(let ee=0;ee<w.__webglFramebuffer[Y].length;ee++)r.deleteFramebuffer(w.__webglFramebuffer[Y][ee]);else r.deleteFramebuffer(w.__webglFramebuffer[Y]);w.__webglDepthbuffer&&r.deleteRenderbuffer(w.__webglDepthbuffer[Y])}else{if(Array.isArray(w.__webglFramebuffer))for(let Y=0;Y<w.__webglFramebuffer.length;Y++)r.deleteFramebuffer(w.__webglFramebuffer[Y]);else r.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&r.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&r.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let Y=0;Y<w.__webglColorRenderbuffer.length;Y++)w.__webglColorRenderbuffer[Y]&&r.deleteRenderbuffer(w.__webglColorRenderbuffer[Y]);w.__webglDepthRenderbuffer&&r.deleteRenderbuffer(w.__webglDepthRenderbuffer)}let G=I.textures;for(let Y=0,ee=G.length;Y<ee;Y++){let X=n.get(G[Y]);X.__webglTexture&&(r.deleteTexture(X.__webglTexture),o.memory.textures--),n.remove(G[Y])}n.remove(I)}let P=0;function B(){P=0}function L(){let I=P;return I>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+i.maxTextures),P+=1,I}function U(I){let w=[];return w.push(I.wrapS),w.push(I.wrapT),w.push(I.wrapR||0),w.push(I.magFilter),w.push(I.minFilter),w.push(I.anisotropy),w.push(I.internalFormat),w.push(I.format),w.push(I.type),w.push(I.generateMipmaps),w.push(I.premultiplyAlpha),w.push(I.flipY),w.push(I.unpackAlignment),w.push(I.colorSpace),w.join()}function O(I,w){let G=n.get(I);if(I.isVideoTexture&&ke(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&G.__version!==I.version){let Y=I.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(G,I,w);return}}else I.isExternalTexture&&(G.__webglTexture=I.sourceTexture?I.sourceTexture:null);t.bindTexture(r.TEXTURE_2D,G.__webglTexture,r.TEXTURE0+w)}function D(I,w){let G=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&G.__version!==I.version){$(G,I,w);return}t.bindTexture(r.TEXTURE_2D_ARRAY,G.__webglTexture,r.TEXTURE0+w)}function j(I,w){let G=n.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&G.__version!==I.version){$(G,I,w);return}t.bindTexture(r.TEXTURE_3D,G.__webglTexture,r.TEXTURE0+w)}function H(I,w){let G=n.get(I);if(I.version>0&&G.__version!==I.version){Q(G,I,w);return}t.bindTexture(r.TEXTURE_CUBE_MAP,G.__webglTexture,r.TEXTURE0+w)}let Z={[fo]:r.REPEAT,[li]:r.CLAMP_TO_EDGE,[po]:r.MIRRORED_REPEAT},ae={[Yt]:r.NEAREST,[Cu]:r.NEAREST_MIPMAP_NEAREST,[yr]:r.NEAREST_MIPMAP_LINEAR,[_n]:r.LINEAR,[ea]:r.LINEAR_MIPMAP_NEAREST,[pi]:r.LINEAR_MIPMAP_LINEAR},de={[Lu]:r.NEVER,[zu]:r.ALWAYS,[Nu]:r.LESS,[fc]:r.LEQUAL,[Du]:r.EQUAL,[Uu]:r.GEQUAL,[Fu]:r.GREATER,[Bu]:r.NOTEQUAL};function re(I,w){if(w.type===Mn&&e.has("OES_texture_float_linear")===!1&&(w.magFilter===_n||w.magFilter===ea||w.magFilter===yr||w.magFilter===pi||w.minFilter===_n||w.minFilter===ea||w.minFilter===yr||w.minFilter===pi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(I,r.TEXTURE_WRAP_S,Z[w.wrapS]),r.texParameteri(I,r.TEXTURE_WRAP_T,Z[w.wrapT]),(I===r.TEXTURE_3D||I===r.TEXTURE_2D_ARRAY)&&r.texParameteri(I,r.TEXTURE_WRAP_R,Z[w.wrapR]),r.texParameteri(I,r.TEXTURE_MAG_FILTER,ae[w.magFilter]),r.texParameteri(I,r.TEXTURE_MIN_FILTER,ae[w.minFilter]),w.compareFunction&&(r.texParameteri(I,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(I,r.TEXTURE_COMPARE_FUNC,de[w.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===Yt||w.minFilter!==yr&&w.minFilter!==pi||w.type===Mn&&e.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||n.get(w).__currentAnisotropy){let G=e.get("EXT_texture_filter_anisotropic");r.texParameterf(I,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,i.getMaxAnisotropy())),n.get(w).__currentAnisotropy=w.anisotropy}}}function Ze(I,w){let G=!1;I.__webglInit===void 0&&(I.__webglInit=!0,w.addEventListener("dispose",A));let Y=w.source,ee=d.get(Y);ee===void 0&&(ee={},d.set(Y,ee));let X=U(w);if(X!==I.__cacheKey){ee[X]===void 0&&(ee[X]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,G=!0),ee[X].usedTimes++;let Ae=ee[I.__cacheKey];Ae!==void 0&&(ee[I.__cacheKey].usedTimes--,Ae.usedTimes===0&&M(w)),I.__cacheKey=X,I.__webglTexture=ee[X].texture}return G}function et(I,w,G){return Math.floor(Math.floor(I/G)/w)}function Ye(I,w,G,Y){let X=I.updateRanges;if(X.length===0)t.texSubImage2D(r.TEXTURE_2D,0,0,0,w.width,w.height,G,Y,w.data);else{X.sort((ie,fe)=>ie.start-fe.start);let Ae=0;for(let ie=1;ie<X.length;ie++){let fe=X[Ae],Pe=X[ie],Se=fe.start+fe.count,he=et(Pe.start,w.width,4),Oe=et(fe.start,w.width,4);Pe.start<=Se+1&&he===Oe&&et(Pe.start+Pe.count-1,w.width,4)===he?fe.count=Math.max(fe.count,Pe.start+Pe.count-fe.start):(++Ae,X[Ae]=Pe)}X.length=Ae+1;let oe=r.getParameter(r.UNPACK_ROW_LENGTH),we=r.getParameter(r.UNPACK_SKIP_PIXELS),Me=r.getParameter(r.UNPACK_SKIP_ROWS);r.pixelStorei(r.UNPACK_ROW_LENGTH,w.width);for(let ie=0,fe=X.length;ie<fe;ie++){let Pe=X[ie],Se=Math.floor(Pe.start/4),he=Math.ceil(Pe.count/4),Oe=Se%w.width,z=Math.floor(Se/w.width),se=he,le=1;r.pixelStorei(r.UNPACK_SKIP_PIXELS,Oe),r.pixelStorei(r.UNPACK_SKIP_ROWS,z),t.texSubImage2D(r.TEXTURE_2D,0,Oe,z,se,le,G,Y,w.data)}I.clearUpdateRanges(),r.pixelStorei(r.UNPACK_ROW_LENGTH,oe),r.pixelStorei(r.UNPACK_SKIP_PIXELS,we),r.pixelStorei(r.UNPACK_SKIP_ROWS,Me)}}function $(I,w,G){let Y=r.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(Y=r.TEXTURE_2D_ARRAY),w.isData3DTexture&&(Y=r.TEXTURE_3D);let ee=Ze(I,w),X=w.source;t.bindTexture(Y,I.__webglTexture,r.TEXTURE0+G);let Ae=n.get(X);if(X.version!==Ae.__version||ee===!0){t.activeTexture(r.TEXTURE0+G);let oe=je.getPrimaries(je.workingColorSpace),we=w.colorSpace===jn?null:je.getPrimaries(w.colorSpace),Me=w.colorSpace===jn||oe===we?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,w.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,w.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Me);let ie=x(w.image,!1,i.maxTextureSize);ie=At(w,ie);let fe=s.convert(w.format,w.colorSpace),Pe=s.convert(w.type),Se=y(w.internalFormat,fe,Pe,w.colorSpace,w.isVideoTexture);re(Y,w);let he,Oe=w.mipmaps,z=w.isVideoTexture!==!0,se=Ae.__version===void 0||ee===!0,le=X.dataReady,ge=T(w,ie);if(w.isDepthTexture)Se=v(w.format===bs,w.type),se&&(z?t.texStorage2D(r.TEXTURE_2D,1,Se,ie.width,ie.height):t.texImage2D(r.TEXTURE_2D,0,Se,ie.width,ie.height,0,fe,Pe,null));else if(w.isDataTexture)if(Oe.length>0){z&&se&&t.texStorage2D(r.TEXTURE_2D,ge,Se,Oe[0].width,Oe[0].height);for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],z?le&&t.texSubImage2D(r.TEXTURE_2D,te,0,0,he.width,he.height,fe,Pe,he.data):t.texImage2D(r.TEXTURE_2D,te,Se,he.width,he.height,0,fe,Pe,he.data);w.generateMipmaps=!1}else z?(se&&t.texStorage2D(r.TEXTURE_2D,ge,Se,ie.width,ie.height),le&&Ye(w,ie,fe,Pe)):t.texImage2D(r.TEXTURE_2D,0,Se,ie.width,ie.height,0,fe,Pe,ie.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){z&&se&&t.texStorage3D(r.TEXTURE_2D_ARRAY,ge,Se,Oe[0].width,Oe[0].height,ie.depth);for(let te=0,K=Oe.length;te<K;te++)if(he=Oe[te],w.format!==cn)if(fe!==null)if(z){if(le)if(w.layerUpdates.size>0){let ve=Mc(he.width,he.height,w.format,w.type);for(let Be of w.layerUpdates){let ot=he.data.subarray(Be*ve/he.data.BYTES_PER_ELEMENT,(Be+1)*ve/he.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,te,0,0,Be,he.width,he.height,1,fe,ot)}w.clearLayerUpdates()}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,he.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,te,Se,he.width,he.height,ie.depth,0,he.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else z?le&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,te,0,0,0,he.width,he.height,ie.depth,fe,Pe,he.data):t.texImage3D(r.TEXTURE_2D_ARRAY,te,Se,he.width,he.height,ie.depth,0,fe,Pe,he.data)}else{z&&se&&t.texStorage2D(r.TEXTURE_2D,ge,Se,Oe[0].width,Oe[0].height);for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],w.format!==cn?fe!==null?z?le&&t.compressedTexSubImage2D(r.TEXTURE_2D,te,0,0,he.width,he.height,fe,he.data):t.compressedTexImage2D(r.TEXTURE_2D,te,Se,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):z?le&&t.texSubImage2D(r.TEXTURE_2D,te,0,0,he.width,he.height,fe,Pe,he.data):t.texImage2D(r.TEXTURE_2D,te,Se,he.width,he.height,0,fe,Pe,he.data)}else if(w.isDataArrayTexture)if(z){if(se&&t.texStorage3D(r.TEXTURE_2D_ARRAY,ge,Se,ie.width,ie.height,ie.depth),le)if(w.layerUpdates.size>0){let te=Mc(ie.width,ie.height,w.format,w.type);for(let K of w.layerUpdates){let ve=ie.data.subarray(K*te/ie.data.BYTES_PER_ELEMENT,(K+1)*te/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,K,ie.width,ie.height,1,fe,Pe,ve)}w.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,fe,Pe,ie.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,Se,ie.width,ie.height,ie.depth,0,fe,Pe,ie.data);else if(w.isData3DTexture)z?(se&&t.texStorage3D(r.TEXTURE_3D,ge,Se,ie.width,ie.height,ie.depth),le&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,fe,Pe,ie.data)):t.texImage3D(r.TEXTURE_3D,0,Se,ie.width,ie.height,ie.depth,0,fe,Pe,ie.data);else if(w.isFramebufferTexture){if(se)if(z)t.texStorage2D(r.TEXTURE_2D,ge,Se,ie.width,ie.height);else{let te=ie.width,K=ie.height;for(let ve=0;ve<ge;ve++)t.texImage2D(r.TEXTURE_2D,ve,Se,te,K,0,fe,Pe,null),te>>=1,K>>=1}}else if(Oe.length>0){if(z&&se){let te=vt(Oe[0]);t.texStorage2D(r.TEXTURE_2D,ge,Se,te.width,te.height)}for(let te=0,K=Oe.length;te<K;te++)he=Oe[te],z?le&&t.texSubImage2D(r.TEXTURE_2D,te,0,0,fe,Pe,he):t.texImage2D(r.TEXTURE_2D,te,Se,fe,Pe,he);w.generateMipmaps=!1}else if(z){if(se){let te=vt(ie);t.texStorage2D(r.TEXTURE_2D,ge,Se,te.width,te.height)}le&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,fe,Pe,ie)}else t.texImage2D(r.TEXTURE_2D,0,Se,fe,Pe,ie);p(w)&&g(Y),Ae.__version=X.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function Q(I,w,G){if(w.image.length!==6)return;let Y=Ze(I,w),ee=w.source;t.bindTexture(r.TEXTURE_CUBE_MAP,I.__webglTexture,r.TEXTURE0+G);let X=n.get(ee);if(ee.version!==X.__version||Y===!0){t.activeTexture(r.TEXTURE0+G);let Ae=je.getPrimaries(je.workingColorSpace),oe=w.colorSpace===jn?null:je.getPrimaries(w.colorSpace),we=w.colorSpace===jn||Ae===oe?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,w.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,w.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,we);let Me=w.isCompressedTexture||w.image[0].isCompressedTexture,ie=w.image[0]&&w.image[0].isDataTexture,fe=[];for(let K=0;K<6;K++)!Me&&!ie?fe[K]=x(w.image[K],!0,i.maxCubemapSize):fe[K]=ie?w.image[K].image:w.image[K],fe[K]=At(w,fe[K]);let Pe=fe[0],Se=s.convert(w.format,w.colorSpace),he=s.convert(w.type),Oe=y(w.internalFormat,Se,he,w.colorSpace),z=w.isVideoTexture!==!0,se=X.__version===void 0||Y===!0,le=ee.dataReady,ge=T(w,Pe);re(r.TEXTURE_CUBE_MAP,w);let te;if(Me){z&&se&&t.texStorage2D(r.TEXTURE_CUBE_MAP,ge,Oe,Pe.width,Pe.height);for(let K=0;K<6;K++){te=fe[K].mipmaps;for(let ve=0;ve<te.length;ve++){let Be=te[ve];w.format!==cn?Se!==null?z?le&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,0,0,Be.width,Be.height,Se,Be.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,Oe,Be.width,Be.height,0,Be.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):z?le&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,0,0,Be.width,Be.height,Se,he,Be.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve,Oe,Be.width,Be.height,0,Se,he,Be.data)}}}else{if(te=w.mipmaps,z&&se){te.length>0&&ge++;let K=vt(fe[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,ge,Oe,K.width,K.height)}for(let K=0;K<6;K++)if(ie){z?le&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,fe[K].width,fe[K].height,Se,he,fe[K].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Oe,fe[K].width,fe[K].height,0,Se,he,fe[K].data);for(let ve=0;ve<te.length;ve++){let ot=te[ve].image[K].image;z?le&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,0,0,ot.width,ot.height,Se,he,ot.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,Oe,ot.width,ot.height,0,Se,he,ot.data)}}else{z?le&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Se,he,fe[K]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Oe,Se,he,fe[K]);for(let ve=0;ve<te.length;ve++){let Be=te[ve];z?le&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,0,0,Se,he,Be.image[K]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+K,ve+1,Oe,Se,he,Be.image[K])}}}p(w)&&g(r.TEXTURE_CUBE_MAP),X.__version=ee.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function xe(I,w,G,Y,ee,X){let Ae=s.convert(G.format,G.colorSpace),oe=s.convert(G.type),we=y(G.internalFormat,Ae,oe,G.colorSpace),Me=n.get(w),ie=n.get(G);if(ie.__renderTarget=w,!Me.__hasExternalTextures){let fe=Math.max(1,w.width>>X),Pe=Math.max(1,w.height>>X);ee===r.TEXTURE_3D||ee===r.TEXTURE_2D_ARRAY?t.texImage3D(ee,X,we,fe,Pe,w.depth,0,Ae,oe,null):t.texImage2D(ee,X,we,fe,Pe,0,Ae,oe,null)}t.bindFramebuffer(r.FRAMEBUFFER,I),be(w)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Y,ee,ie.__webglTexture,0,ft(w)):(ee===r.TEXTURE_2D||ee>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Y,ee,ie.__webglTexture,X),t.bindFramebuffer(r.FRAMEBUFFER,null)}function De(I,w,G){if(r.bindRenderbuffer(r.RENDERBUFFER,I),w.depthBuffer){let Y=w.depthTexture,ee=Y&&Y.isDepthTexture?Y.type:null,X=v(w.stencilBuffer,ee),Ae=w.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,oe=ft(w);be(w)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,oe,X,w.width,w.height):G?r.renderbufferStorageMultisample(r.RENDERBUFFER,oe,X,w.width,w.height):r.renderbufferStorage(r.RENDERBUFFER,X,w.width,w.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Ae,r.RENDERBUFFER,I)}else{let Y=w.textures;for(let ee=0;ee<Y.length;ee++){let X=Y[ee],Ae=s.convert(X.format,X.colorSpace),oe=s.convert(X.type),we=y(X.internalFormat,Ae,oe,X.colorSpace),Me=ft(w);G&&be(w)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Me,we,w.width,w.height):be(w)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Me,we,w.width,w.height):r.renderbufferStorage(r.RENDERBUFFER,we,w.width,w.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Te(I,w){if(w&&w.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,I),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Y=n.get(w.depthTexture);Y.__renderTarget=w,(!Y.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),O(w.depthTexture,0);let ee=Y.__webglTexture,X=ft(w);if(w.depthTexture.format===cs)be(w)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,ee,0,X):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,ee,0);else if(w.depthTexture.format===bs)be(w)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,ee,0,X):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,ee,0);else throw new Error("Unknown depthTexture format")}function $e(I){let w=n.get(I),G=I.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==I.depthTexture){let Y=I.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),Y){let ee=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,Y.removeEventListener("dispose",ee)};Y.addEventListener("dispose",ee),w.__depthDisposeCallback=ee}w.__boundDepthTexture=Y}if(I.depthTexture&&!w.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");let Y=I.texture.mipmaps;Y&&Y.length>0?Te(w.__webglFramebuffer[0],I):Te(w.__webglFramebuffer,I)}else if(G){w.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(r.FRAMEBUFFER,w.__webglFramebuffer[Y]),w.__webglDepthbuffer[Y]===void 0)w.__webglDepthbuffer[Y]=r.createRenderbuffer(),De(w.__webglDepthbuffer[Y],I,!1);else{let ee=I.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,X=w.__webglDepthbuffer[Y];r.bindRenderbuffer(r.RENDERBUFFER,X),r.framebufferRenderbuffer(r.FRAMEBUFFER,ee,r.RENDERBUFFER,X)}}else{let Y=I.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(r.FRAMEBUFFER,w.__webglFramebuffer[0]):t.bindFramebuffer(r.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=r.createRenderbuffer(),De(w.__webglDepthbuffer,I,!1);else{let ee=I.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,X=w.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,X),r.framebufferRenderbuffer(r.FRAMEBUFFER,ee,r.RENDERBUFFER,X)}}t.bindFramebuffer(r.FRAMEBUFFER,null)}function Lt(I,w,G){let Y=n.get(I);w!==void 0&&xe(Y.__webglFramebuffer,I,I.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),G!==void 0&&$e(I)}function N(I){let w=I.texture,G=n.get(I),Y=n.get(w);I.addEventListener("dispose",C);let ee=I.textures,X=I.isWebGLCubeRenderTarget===!0,Ae=ee.length>1;if(Ae||(Y.__webglTexture===void 0&&(Y.__webglTexture=r.createTexture()),Y.__version=w.version,o.memory.textures++),X){G.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(w.mipmaps&&w.mipmaps.length>0){G.__webglFramebuffer[oe]=[];for(let we=0;we<w.mipmaps.length;we++)G.__webglFramebuffer[oe][we]=r.createFramebuffer()}else G.__webglFramebuffer[oe]=r.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){G.__webglFramebuffer=[];for(let oe=0;oe<w.mipmaps.length;oe++)G.__webglFramebuffer[oe]=r.createFramebuffer()}else G.__webglFramebuffer=r.createFramebuffer();if(Ae)for(let oe=0,we=ee.length;oe<we;oe++){let Me=n.get(ee[oe]);Me.__webglTexture===void 0&&(Me.__webglTexture=r.createTexture(),o.memory.textures++)}if(I.samples>0&&be(I)===!1){G.__webglMultisampledFramebuffer=r.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let oe=0;oe<ee.length;oe++){let we=ee[oe];G.__webglColorRenderbuffer[oe]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,G.__webglColorRenderbuffer[oe]);let Me=s.convert(we.format,we.colorSpace),ie=s.convert(we.type),fe=y(we.internalFormat,Me,ie,we.colorSpace,I.isXRRenderTarget===!0),Pe=ft(I);r.renderbufferStorageMultisample(r.RENDERBUFFER,Pe,fe,I.width,I.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+oe,r.RENDERBUFFER,G.__webglColorRenderbuffer[oe])}r.bindRenderbuffer(r.RENDERBUFFER,null),I.depthBuffer&&(G.__webglDepthRenderbuffer=r.createRenderbuffer(),De(G.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(X){t.bindTexture(r.TEXTURE_CUBE_MAP,Y.__webglTexture),re(r.TEXTURE_CUBE_MAP,w);for(let oe=0;oe<6;oe++)if(w.mipmaps&&w.mipmaps.length>0)for(let we=0;we<w.mipmaps.length;we++)xe(G.__webglFramebuffer[oe][we],I,w,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,we);else xe(G.__webglFramebuffer[oe],I,w,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);p(w)&&g(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ae){for(let oe=0,we=ee.length;oe<we;oe++){let Me=ee[oe],ie=n.get(Me),fe=r.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(fe=I.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(fe,ie.__webglTexture),re(fe,Me),xe(G.__webglFramebuffer,I,Me,r.COLOR_ATTACHMENT0+oe,fe,0),p(Me)&&g(fe)}t.unbindTexture()}else{let oe=r.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(oe=I.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(oe,Y.__webglTexture),re(oe,w),w.mipmaps&&w.mipmaps.length>0)for(let we=0;we<w.mipmaps.length;we++)xe(G.__webglFramebuffer[we],I,w,r.COLOR_ATTACHMENT0,oe,we);else xe(G.__webglFramebuffer,I,w,r.COLOR_ATTACHMENT0,oe,0);p(w)&&g(oe),t.unbindTexture()}I.depthBuffer&&$e(I)}function dt(I){let w=I.textures;for(let G=0,Y=w.length;G<Y;G++){let ee=w[G];if(p(ee)){let X=_(I),Ae=n.get(ee).__webglTexture;t.bindTexture(X,Ae),g(X),t.unbindTexture()}}}let Ue=[],Le=[];function ye(I){if(I.samples>0){if(be(I)===!1){let w=I.textures,G=I.width,Y=I.height,ee=r.COLOR_BUFFER_BIT,X=I.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Ae=n.get(I),oe=w.length>1;if(oe)for(let Me=0;Me<w.length;Me++)t.bindFramebuffer(r.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+Me,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,Ae.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+Me,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer);let we=I.texture.mipmaps;we&&we.length>0?t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer[0]):t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Ae.__webglFramebuffer);for(let Me=0;Me<w.length;Me++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(ee|=r.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(ee|=r.STENCIL_BUFFER_BIT)),oe){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Ae.__webglColorRenderbuffer[Me]);let ie=n.get(w[Me]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,ie,0)}r.blitFramebuffer(0,0,G,Y,0,0,G,Y,ee,r.NEAREST),c===!0&&(Ue.length=0,Le.length=0,Ue.push(r.COLOR_ATTACHMENT0+Me),I.depthBuffer&&I.resolveDepthBuffer===!1&&(Ue.push(X),Le.push(X),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,Le)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,Ue))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),oe)for(let Me=0;Me<w.length;Me++){t.bindFramebuffer(r.FRAMEBUFFER,Ae.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+Me,r.RENDERBUFFER,Ae.__webglColorRenderbuffer[Me]);let ie=n.get(w[Me]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,Ae.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+Me,r.TEXTURE_2D,ie,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Ae.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&c){let w=I.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[w])}}}function ft(I){return Math.min(i.maxSamples,I.samples)}function be(I){let w=n.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function ke(I){let w=o.render.frame;a.get(I)!==w&&(a.set(I,w),I.update())}function At(I,w){let G=I.colorSpace,Y=I.format,ee=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||G!==Ii&&G!==jn&&(je.getTransfer(G)===tt?(Y!==cn||ee!==wn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),w}function vt(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(h.width=I.naturalWidth||I.width,h.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(h.width=I.displayWidth,h.height=I.displayHeight):(h.width=I.width,h.height=I.height),h}this.allocateTextureUnit=L,this.resetTextureUnits=B,this.setTexture2D=O,this.setTexture2DArray=D,this.setTexture3D=j,this.setTextureCube=H,this.rebindTextures=Lt,this.setupRenderTarget=N,this.updateRenderTargetMipmap=dt,this.updateMultisampleRenderTarget=ye,this.setupDepthRenderbuffer=$e,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=be}function Jx(r,e){function t(n,i=jn){let s,o=je.getTransfer(i);if(n===wn)return r.UNSIGNED_BYTE;if(n===na)return r.UNSIGNED_SHORT_4_4_4_4;if(n===ia)return r.UNSIGNED_SHORT_5_5_5_1;if(n===ac)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===lc)return r.UNSIGNED_INT_10F_11F_11F_REV;if(n===rc)return r.BYTE;if(n===oc)return r.SHORT;if(n===_s)return r.UNSIGNED_SHORT;if(n===ta)return r.INT;if(n===mi)return r.UNSIGNED_INT;if(n===Mn)return r.FLOAT;if(n===vs)return r.HALF_FLOAT;if(n===cc)return r.ALPHA;if(n===hc)return r.RGB;if(n===cn)return r.RGBA;if(n===cs)return r.DEPTH_COMPONENT;if(n===bs)return r.DEPTH_STENCIL;if(n===sa)return r.RED;if(n===ra)return r.RED_INTEGER;if(n===uc)return r.RG;if(n===oa)return r.RG_INTEGER;if(n===aa)return r.RGBA_INTEGER;if(n===br||n===wr||n===Mr||n===Sr)if(o===tt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===br)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===wr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Mr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Sr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===br)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===wr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Mr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Sr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===la||n===ca||n===ha||n===ua)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===la)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ca)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ha)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ua)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===da||n===fa||n===pa)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===da||n===fa)return o===tt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===pa)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ma||n===ga||n===xa||n===_a||n===va||n===ya||n===ba||n===wa||n===Ma||n===Sa||n===Aa||n===Ta||n===Ea||n===Ca)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===ma)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ga)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===xa)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===_a)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===va)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ya)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ba)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===wa)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ma)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Sa)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Aa)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ta)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ea)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ca)return o===tt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ra||n===Ia||n===Pa)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Ra)return o===tt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ia)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Pa)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===La||n===Na||n===Da||n===Fa)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===La)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Na)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Da)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Fa)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ys?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:t}}var Qx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,e_=`
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

}`,Bc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new lr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new bn({vertexShader:Qx,fragmentShader:e_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ht(new Yn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Uc=class extends qn{constructor(e,t){super();let n=this,i=null,s=1,o=null,l="local-floor",c=1,h=null,a=null,u=null,d=null,f=null,m=null,x=typeof XRWebGLBinding<"u",p=new Bc,g={},_=t.getContextAttributes(),y=null,v=null,T=[],A=[],C=new Ee,R=null,M=new Xt;M.viewport=new xt;let b=new Xt;b.viewport=new xt;let P=[M,b],B=new Ho,L=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let Q=T[$];return Q===void 0&&(Q=new fs,T[$]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function($){let Q=T[$];return Q===void 0&&(Q=new fs,T[$]=Q),Q.getGripSpace()},this.getHand=function($){let Q=T[$];return Q===void 0&&(Q=new fs,T[$]=Q),Q.getHandSpace()};function O($){let Q=A.indexOf($.inputSource);if(Q===-1)return;let xe=T[Q];xe!==void 0&&(xe.update($.inputSource,$.frame,h||o),xe.dispatchEvent({type:$.type,data:$.inputSource}))}function D(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",D),i.removeEventListener("inputsourceschange",j);for(let $=0;$<T.length;$++){let Q=A[$];Q!==null&&(A[$]=null,T[$].disconnect(Q))}L=null,U=null,p.reset();for(let $ in g)delete g[$];e.setRenderTarget(y),f=null,d=null,u=null,i=null,v=null,Ye.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){s=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){l=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||o},this.setReferenceSpace=function($){h=$},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&x&&(u=new XRWebGLBinding(i,t)),u},this.getFrame=function(){return m},this.getSession=function(){return i},this.setSession=async function($){if(i=$,i!==null){if(y=e.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",D),i.addEventListener("inputsourceschange",j),_.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(C),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,De=null,Te=null;_.depth&&(Te=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=_.stencil?bs:cs,De=_.stencil?ys:mi);let $e={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:s};u=this.getBinding(),d=u.createProjectionLayer($e),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new Rn(d.textureWidth,d.textureHeight,{format:cn,type:wn,depthTexture:new ar(d.textureWidth,d.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{let xe={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,t,xe),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new Rn(f.framebufferWidth,f.framebufferHeight,{format:cn,type:wn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),h=null,o=await i.requestReferenceSpace(l),Ye.setContext(i),Ye.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function j($){for(let Q=0;Q<$.removed.length;Q++){let xe=$.removed[Q],De=A.indexOf(xe);De>=0&&(A[De]=null,T[De].disconnect(xe))}for(let Q=0;Q<$.added.length;Q++){let xe=$.added[Q],De=A.indexOf(xe);if(De===-1){for(let $e=0;$e<T.length;$e++)if($e>=A.length){A.push(xe),De=$e;break}else if(A[$e]===null){A[$e]=xe,De=$e;break}if(De===-1)break}let Te=T[De];Te&&Te.connect(xe)}}let H=new F,Z=new F;function ae($,Q,xe){H.setFromMatrixPosition(Q.matrixWorld),Z.setFromMatrixPosition(xe.matrixWorld);let De=H.distanceTo(Z),Te=Q.projectionMatrix.elements,$e=xe.projectionMatrix.elements,Lt=Te[14]/(Te[10]-1),N=Te[14]/(Te[10]+1),dt=(Te[9]+1)/Te[5],Ue=(Te[9]-1)/Te[5],Le=(Te[8]-1)/Te[0],ye=($e[8]+1)/$e[0],ft=Lt*Le,be=Lt*ye,ke=De/(-Le+ye),At=ke*-Le;if(Q.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(At),$.translateZ(ke),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Te[10]===-1)$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let vt=Lt+ke,I=N+ke,w=ft-At,G=be+(De-At),Y=dt*N/I*vt,ee=Ue*N/I*vt;$.projectionMatrix.makePerspective(w,G,Y,ee,vt,I),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function de($,Q){Q===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(Q.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(i===null)return;let Q=$.near,xe=$.far;p.texture!==null&&(p.depthNear>0&&(Q=p.depthNear),p.depthFar>0&&(xe=p.depthFar)),B.near=b.near=M.near=Q,B.far=b.far=M.far=xe,(L!==B.near||U!==B.far)&&(i.updateRenderState({depthNear:B.near,depthFar:B.far}),L=B.near,U=B.far),B.layers.mask=$.layers.mask|6,M.layers.mask=B.layers.mask&3,b.layers.mask=B.layers.mask&5;let De=$.parent,Te=B.cameras;de(B,De);for(let $e=0;$e<Te.length;$e++)de(Te[$e],De);Te.length===2?ae(B,M,b):B.projectionMatrix.copy(M.projectionMatrix),re($,B,De)};function re($,Q,xe){xe===null?$.matrix.copy(Q.matrixWorld):($.matrix.copy(xe.matrixWorld),$.matrix.invert(),$.matrix.multiply(Q.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(Q.projectionMatrix),$.projectionMatrixInverse.copy(Q.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=hs*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function($){c=$,d!==null&&(d.fixedFoveation=$),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=$)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(B)},this.getCameraTexture=function($){return g[$]};let Ze=null;function et($,Q){if(a=Q.getViewerPose(h||o),m=Q,a!==null){let xe=a.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let De=!1;xe.length!==B.cameras.length&&(B.cameras.length=0,De=!0);for(let N=0;N<xe.length;N++){let dt=xe[N],Ue=null;if(f!==null)Ue=f.getViewport(dt);else{let ye=u.getViewSubImage(d,dt);Ue=ye.viewport,N===0&&(e.setRenderTargetTextures(v,ye.colorTexture,ye.depthStencilTexture),e.setRenderTarget(v))}let Le=P[N];Le===void 0&&(Le=new Xt,Le.layers.enable(N),Le.viewport=new xt,P[N]=Le),Le.matrix.fromArray(dt.transform.matrix),Le.matrix.decompose(Le.position,Le.quaternion,Le.scale),Le.projectionMatrix.fromArray(dt.projectionMatrix),Le.projectionMatrixInverse.copy(Le.projectionMatrix).invert(),Le.viewport.set(Ue.x,Ue.y,Ue.width,Ue.height),N===0&&(B.matrix.copy(Le.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),De===!0&&B.cameras.push(Le)}let Te=i.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&x){u=n.getBinding();let N=u.getDepthInformation(xe[0]);N&&N.isValid&&N.texture&&p.init(N,i.renderState)}if(Te&&Te.includes("camera-access")&&x){e.state.unbindTexture(),u=n.getBinding();for(let N=0;N<xe.length;N++){let dt=xe[N].camera;if(dt){let Ue=g[dt];Ue||(Ue=new lr,g[dt]=Ue);let Le=u.getCameraImage(dt);Ue.sourceTexture=Le}}}}for(let xe=0;xe<T.length;xe++){let De=A[xe],Te=T[xe];De!==null&&Te!==void 0&&Te.update(De,Q,h||o)}Ze&&Ze($,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),m=null}let Ye=new fd;Ye.setAnimationLoop(et),this.setAnimationLoop=function($){Ze=$},this.dispose=function(){}}},ki=new vn,t_=new rt;function n_(r,e){function t(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,vc(r)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function i(p,g,_,y,v){g.isMeshBasicMaterial||g.isMeshLambertMaterial?s(p,g):g.isMeshToonMaterial?(s(p,g),u(p,g)):g.isMeshPhongMaterial?(s(p,g),a(p,g)):g.isMeshStandardMaterial?(s(p,g),d(p,g),g.isMeshPhysicalMaterial&&f(p,g,v)):g.isMeshMatcapMaterial?(s(p,g),m(p,g)):g.isMeshDepthMaterial?s(p,g):g.isMeshDistanceMaterial?(s(p,g),x(p,g)):g.isMeshNormalMaterial?s(p,g):g.isLineBasicMaterial?(o(p,g),g.isLineDashedMaterial&&l(p,g)):g.isPointsMaterial?c(p,g,_,y):g.isSpriteMaterial?h(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function s(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,t(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===Gt&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,t(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===Gt&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,t(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,t(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);let _=e.get(g),y=_.envMap,v=_.envMapRotation;y&&(p.envMap.value=y,ki.copy(v),ki.x*=-1,ki.y*=-1,ki.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(ki.y*=-1,ki.z*=-1),p.envMapRotation.value.setFromMatrix4(t_.makeRotationFromEuler(ki)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,p.aoMapTransform))}function o(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform))}function l(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function c(p,g,_,y){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*_,p.scale.value=y*.5,g.map&&(p.map.value=g.map,t(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function h(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,t(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,t(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function a(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function u(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function d(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,_){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Gt&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=_.texture,p.transmissionSamplerSize.value.set(_.width,_.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function x(p,g){let _=e.get(g).light;p.referencePosition.value.setFromMatrixPosition(_.matrixWorld),p.nearDistance.value=_.shadow.camera.near,p.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function i_(r,e,t,n){let i={},s={},o=[],l=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function c(_,y){let v=y.program;n.uniformBlockBinding(_,v)}function h(_,y){let v=i[_.id];v===void 0&&(m(_),v=a(_),i[_.id]=v,_.addEventListener("dispose",p));let T=y.program;n.updateUBOMapping(_,T);let A=e.render.frame;s[_.id]!==A&&(d(_),s[_.id]=A)}function a(_){let y=u();_.__bindingPointIndex=y;let v=r.createBuffer(),T=_.__size,A=_.usage;return r.bindBuffer(r.UNIFORM_BUFFER,v),r.bufferData(r.UNIFORM_BUFFER,T,A),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,v),v}function u(){for(let _=0;_<l;_++)if(o.indexOf(_)===-1)return o.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(_){let y=i[_.id],v=_.uniforms,T=_.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let A=0,C=v.length;A<C;A++){let R=Array.isArray(v[A])?v[A]:[v[A]];for(let M=0,b=R.length;M<b;M++){let P=R[M];if(f(P,A,M,T)===!0){let B=P.__offset,L=Array.isArray(P.value)?P.value:[P.value],U=0;for(let O=0;O<L.length;O++){let D=L[O],j=x(D);typeof D=="number"||typeof D=="boolean"?(P.__data[0]=D,r.bufferSubData(r.UNIFORM_BUFFER,B+U,P.__data)):D.isMatrix3?(P.__data[0]=D.elements[0],P.__data[1]=D.elements[1],P.__data[2]=D.elements[2],P.__data[3]=0,P.__data[4]=D.elements[3],P.__data[5]=D.elements[4],P.__data[6]=D.elements[5],P.__data[7]=0,P.__data[8]=D.elements[6],P.__data[9]=D.elements[7],P.__data[10]=D.elements[8],P.__data[11]=0):(D.toArray(P.__data,U),U+=j.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,B,P.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(_,y,v,T){let A=_.value,C=y+"_"+v;if(T[C]===void 0)return typeof A=="number"||typeof A=="boolean"?T[C]=A:T[C]=A.clone(),!0;{let R=T[C];if(typeof A=="number"||typeof A=="boolean"){if(R!==A)return T[C]=A,!0}else if(R.equals(A)===!1)return R.copy(A),!0}return!1}function m(_){let y=_.uniforms,v=0,T=16;for(let C=0,R=y.length;C<R;C++){let M=Array.isArray(y[C])?y[C]:[y[C]];for(let b=0,P=M.length;b<P;b++){let B=M[b],L=Array.isArray(B.value)?B.value:[B.value];for(let U=0,O=L.length;U<O;U++){let D=L[U],j=x(D),H=v%T,Z=H%j.boundary,ae=H+Z;v+=Z,ae!==0&&T-ae<j.storage&&(v+=T-ae),B.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=v,v+=j.storage}}}let A=v%T;return A>0&&(v+=T-A),_.__size=v,_.__cache={},this}function x(_){let y={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(y.boundary=4,y.storage=4):_.isVector2?(y.boundary=8,y.storage=8):_.isVector3||_.isColor?(y.boundary=16,y.storage=12):_.isVector4?(y.boundary=16,y.storage=16):_.isMatrix3?(y.boundary=48,y.storage=48):_.isMatrix4?(y.boundary=64,y.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),y}function p(_){let y=_.target;y.removeEventListener("dispose",p);let v=o.indexOf(y.__bindingPointIndex);o.splice(v,1),r.deleteBuffer(i[y.id]),delete i[y.id],delete s[y.id]}function g(){for(let _ in i)r.deleteBuffer(i[_]);o=[],i={},s={}}return{bind:c,update:h,dispose:g}}var ka=class{constructor(e={}){let{canvas:t=Ou(),context:n=null,depth:i=!0,stencil:s=!1,alpha:o=!1,antialias:l=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:h=!1,powerPreference:a="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;let m=new Uint32Array(4),x=new Int32Array(4),p=null,g=null,_=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Zn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let v=this,T=!1;this._outputColorSpace=Rt;let A=0,C=0,R=null,M=-1,b=null,P=new xt,B=new xt,L=null,U=new Ge(0),O=0,D=t.width,j=t.height,H=1,Z=null,ae=null,de=new xt(0,0,D,j),re=new xt(0,0,D,j),Ze=!1,et=new ms,Ye=!1,$=!1,Q=new rt,xe=new F,De=new xt,Te={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},$e=!1;function Lt(){return R===null?H:1}let N=n;function dt(E,k){return t.getContext(E,k)}try{let E={alpha:!0,depth:i,stencil:s,antialias:l,premultipliedAlpha:c,preserveDrawingBuffer:h,powerPreference:a,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",le,!1),t.addEventListener("webglcontextrestored",ge,!1),t.addEventListener("webglcontextcreationerror",te,!1),N===null){let k="webgl2";if(N=dt(k,E),N===null)throw dt(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let Ue,Le,ye,ft,be,ke,At,vt,I,w,G,Y,ee,X,Ae,oe,we,Me,ie,fe,Pe,Se,he,Oe;function z(){Ue=new b0(N),Ue.init(),Se=new Jx(N,Ue),Le=new p0(N,Ue,e,Se),ye=new jx(N,Ue),Le.reversedDepthBuffer&&d&&ye.buffers.depth.setReversed(!0),ft=new S0(N),be=new Ux,ke=new Kx(N,Ue,ye,be,Le,Se,ft),At=new g0(v),vt=new y0(v),I=new Ip(N),he=new d0(N,I),w=new w0(N,I,ft,he),G=new T0(N,w,I,ft),ie=new A0(N,Le,ke),oe=new m0(be),Y=new Bx(v,At,vt,Ue,Le,he,oe),ee=new n_(v,be),X=new Ox,Ae=new qx(Ue),Me=new u0(v,At,vt,ye,G,f,c),we=new $x(v,G,Le),Oe=new i_(N,ft,Le,ye),fe=new f0(N,Ue,ft),Pe=new M0(N,Ue,ft),ft.programs=Y.programs,v.capabilities=Le,v.extensions=Ue,v.properties=be,v.renderLists=X,v.shadowMap=we,v.state=ye,v.info=ft}z();let se=new Uc(v,N);this.xr=se,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let E=Ue.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=Ue.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(E){E!==void 0&&(H=E,this.setSize(D,j,!1))},this.getSize=function(E){return E.set(D,j)},this.setSize=function(E,k,W=!0){if(se.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}D=E,j=k,t.width=Math.floor(E*H),t.height=Math.floor(k*H),W===!0&&(t.style.width=E+"px",t.style.height=k+"px"),this.setViewport(0,0,E,k)},this.getDrawingBufferSize=function(E){return E.set(D*H,j*H).floor()},this.setDrawingBufferSize=function(E,k,W){D=E,j=k,H=W,t.width=Math.floor(E*W),t.height=Math.floor(k*W),this.setViewport(0,0,E,k)},this.getCurrentViewport=function(E){return E.copy(P)},this.getViewport=function(E){return E.copy(de)},this.setViewport=function(E,k,W,q){E.isVector4?de.set(E.x,E.y,E.z,E.w):de.set(E,k,W,q),ye.viewport(P.copy(de).multiplyScalar(H).round())},this.getScissor=function(E){return E.copy(re)},this.setScissor=function(E,k,W,q){E.isVector4?re.set(E.x,E.y,E.z,E.w):re.set(E,k,W,q),ye.scissor(B.copy(re).multiplyScalar(H).round())},this.getScissorTest=function(){return Ze},this.setScissorTest=function(E){ye.setScissorTest(Ze=E)},this.setOpaqueSort=function(E){Z=E},this.setTransparentSort=function(E){ae=E},this.getClearColor=function(E){return E.copy(Me.getClearColor())},this.setClearColor=function(){Me.setClearColor(...arguments)},this.getClearAlpha=function(){return Me.getClearAlpha()},this.setClearAlpha=function(){Me.setClearAlpha(...arguments)},this.clear=function(E=!0,k=!0,W=!0){let q=0;if(E){let V=!1;if(R!==null){let ne=R.texture.format;V=ne===aa||ne===oa||ne===ra}if(V){let ne=R.texture.type,ue=ne===wn||ne===mi||ne===_s||ne===ys||ne===na||ne===ia,_e=Me.getClearColor(),pe=Me.getClearAlpha(),Ie=_e.r,Ne=_e.g,Ce=_e.b;ue?(m[0]=Ie,m[1]=Ne,m[2]=Ce,m[3]=pe,N.clearBufferuiv(N.COLOR,0,m)):(x[0]=Ie,x[1]=Ne,x[2]=Ce,x[3]=pe,N.clearBufferiv(N.COLOR,0,x))}else q|=N.COLOR_BUFFER_BIT}k&&(q|=N.DEPTH_BUFFER_BIT),W&&(q|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",le,!1),t.removeEventListener("webglcontextrestored",ge,!1),t.removeEventListener("webglcontextcreationerror",te,!1),Me.dispose(),X.dispose(),Ae.dispose(),be.dispose(),At.dispose(),vt.dispose(),G.dispose(),he.dispose(),Oe.dispose(),Y.dispose(),se.dispose(),se.removeEventListener("sessionstart",En),se.removeEventListener("sessionend",dh),yi.stop()};function le(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function ge(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;let E=ft.autoReset,k=we.enabled,W=we.autoUpdate,q=we.needsUpdate,V=we.type;z(),ft.autoReset=E,we.enabled=k,we.autoUpdate=W,we.needsUpdate=q,we.type=V}function te(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function K(E){let k=E.target;k.removeEventListener("dispose",K),ve(k)}function ve(E){Be(E),be.remove(E)}function Be(E){let k=be.get(E).programs;k!==void 0&&(k.forEach(function(W){Y.releaseProgram(W)}),E.isShaderMaterial&&Y.releaseShaderCache(E))}this.renderBufferDirect=function(E,k,W,q,V,ne){k===null&&(k=Te);let ue=V.isMesh&&V.matrixWorld.determinant()<0,_e=lf(E,k,W,q,V);ye.setMaterial(q,ue);let pe=W.index,Ie=1;if(q.wireframe===!0){if(pe=w.getWireframeAttribute(W),pe===void 0)return;Ie=2}let Ne=W.drawRange,Ce=W.attributes.position,Xe=Ne.start*Ie,it=(Ne.start+Ne.count)*Ie;ne!==null&&(Xe=Math.max(Xe,ne.start*Ie),it=Math.min(it,(ne.start+ne.count)*Ie)),pe!==null?(Xe=Math.max(Xe,0),it=Math.min(it,pe.count)):Ce!=null&&(Xe=Math.max(Xe,0),it=Math.min(it,Ce.count));let _t=it-Xe;if(_t<0||_t===1/0)return;he.setup(V,q,_e,W,pe);let at,st=fe;if(pe!==null&&(at=I.get(pe),st=Pe,st.setIndex(at)),V.isMesh)q.wireframe===!0?(ye.setLineWidth(q.wireframeLinewidth*Lt()),st.setMode(N.LINES)):st.setMode(N.TRIANGLES);else if(V.isLine){let Re=q.linewidth;Re===void 0&&(Re=1),ye.setLineWidth(Re*Lt()),V.isLineSegments?st.setMode(N.LINES):V.isLineLoop?st.setMode(N.LINE_LOOP):st.setMode(N.LINE_STRIP)}else V.isPoints?st.setMode(N.POINTS):V.isSprite&&st.setMode(N.TRIANGLES);if(V.isBatchedMesh)if(V._multiDrawInstances!==null)us("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),st.renderMultiDrawInstances(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount,V._multiDrawInstances);else if(Ue.get("WEBGL_multi_draw"))st.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let Re=V._multiDrawStarts,mt=V._multiDrawCounts,Ke=V._multiDrawCount,Kt=pe?I.get(pe).bytesPerElement:1,Xi=be.get(q).currentProgram.getUniforms();for(let Jt=0;Jt<Ke;Jt++)Xi.setValue(N,"_gl_DrawID",Jt),st.render(Re[Jt]/Kt,mt[Jt])}else if(V.isInstancedMesh)st.renderInstances(Xe,_t,V.count);else if(W.isInstancedBufferGeometry){let Re=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,mt=Math.min(W.instanceCount,Re);st.renderInstances(Xe,_t,mt)}else st.render(Xe,_t)};function ot(E,k,W){E.transparent===!0&&E.side===Ut&&E.forceSinglePass===!1?(E.side=Gt,E.needsUpdate=!0,Vr(E,k,W),E.side=Wn,E.needsUpdate=!0,Vr(E,k,W),E.side=Ut):Vr(E,k,W)}this.compile=function(E,k,W=null){W===null&&(W=E),g=Ae.get(W),g.init(k),y.push(g),W.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(g.pushLight(V),V.castShadow&&g.pushShadow(V))}),E!==W&&E.traverseVisible(function(V){V.isLight&&V.layers.test(k.layers)&&(g.pushLight(V),V.castShadow&&g.pushShadow(V))}),g.setupLights();let q=new Set;return E.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let ne=V.material;if(ne)if(Array.isArray(ne))for(let ue=0;ue<ne.length;ue++){let _e=ne[ue];ot(_e,W,V),q.add(_e)}else ot(ne,W,V),q.add(ne)}),g=y.pop(),q},this.compileAsync=function(E,k,W=null){let q=this.compile(E,k,W);return new Promise(V=>{function ne(){if(q.forEach(function(ue){be.get(ue).currentProgram.isReady()&&q.delete(ue)}),q.size===0){V(E);return}setTimeout(ne,10)}Ue.get("KHR_parallel_shader_compile")!==null?ne():setTimeout(ne,10)})};let Je=null;function Un(E){Je&&Je(E)}function En(){yi.stop()}function dh(){yi.start()}let yi=new fd;yi.setAnimationLoop(Un),typeof self<"u"&&yi.setContext(self),this.setAnimationLoop=function(E){Je=E,se.setAnimationLoop(E),E===null?yi.stop():yi.start()},se.addEventListener("sessionstart",En),se.addEventListener("sessionend",dh),this.render=function(E,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(se.cameraAutoUpdate===!0&&se.updateCamera(k),k=se.getCamera()),E.isScene===!0&&E.onBeforeRender(v,E,k,R),g=Ae.get(E,y.length),g.init(k),y.push(g),Q.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),et.setFromProjectionMatrix(Q,xn,k.reversedDepth),$=this.localClippingEnabled,Ye=oe.init(this.clippingPlanes,$),p=X.get(E,_.length),p.init(),_.push(p),se.enabled===!0&&se.isPresenting===!0){let ne=v.xr.getDepthSensingMesh();ne!==null&&fl(ne,k,-1/0,v.sortObjects)}fl(E,k,0,v.sortObjects),p.finish(),v.sortObjects===!0&&p.sort(Z,ae),$e=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,$e&&Me.addToRenderList(p,E),this.info.render.frame++,Ye===!0&&oe.beginShadows();let W=g.state.shadowsArray;we.render(W,E,k),Ye===!0&&oe.endShadows(),this.info.autoReset===!0&&this.info.reset();let q=p.opaque,V=p.transmissive;if(g.setupLights(),k.isArrayCamera){let ne=k.cameras;if(V.length>0)for(let ue=0,_e=ne.length;ue<_e;ue++){let pe=ne[ue];ph(q,V,E,pe)}$e&&Me.render(E);for(let ue=0,_e=ne.length;ue<_e;ue++){let pe=ne[ue];fh(p,E,pe,pe.viewport)}}else V.length>0&&ph(q,V,E,k),$e&&Me.render(E),fh(p,E,k);R!==null&&C===0&&(ke.updateMultisampleRenderTarget(R),ke.updateRenderTargetMipmap(R)),E.isScene===!0&&E.onAfterRender(v,E,k),he.resetDefaultState(),M=-1,b=null,y.pop(),y.length>0?(g=y[y.length-1],Ye===!0&&oe.setGlobalState(v.clippingPlanes,g.state.camera)):g=null,_.pop(),_.length>0?p=_[_.length-1]:p=null};function fl(E,k,W,q){if(E.visible===!1)return;if(E.layers.test(k.layers)){if(E.isGroup)W=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(k);else if(E.isLight)g.pushLight(E),E.castShadow&&g.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||et.intersectsSprite(E)){q&&De.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Q);let ue=G.update(E),_e=E.material;_e.visible&&p.push(E,ue,_e,W,De.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||et.intersectsObject(E))){let ue=G.update(E),_e=E.material;if(q&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),De.copy(E.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),De.copy(ue.boundingSphere.center)),De.applyMatrix4(E.matrixWorld).applyMatrix4(Q)),Array.isArray(_e)){let pe=ue.groups;for(let Ie=0,Ne=pe.length;Ie<Ne;Ie++){let Ce=pe[Ie],Xe=_e[Ce.materialIndex];Xe&&Xe.visible&&p.push(E,ue,Xe,W,De.z,Ce)}}else _e.visible&&p.push(E,ue,_e,W,De.z,null)}}let ne=E.children;for(let ue=0,_e=ne.length;ue<_e;ue++)fl(ne[ue],k,W,q)}function fh(E,k,W,q){let V=E.opaque,ne=E.transmissive,ue=E.transparent;g.setupLightsView(W),Ye===!0&&oe.setGlobalState(v.clippingPlanes,W),q&&ye.viewport(P.copy(q)),V.length>0&&kr(V,k,W),ne.length>0&&kr(ne,k,W),ue.length>0&&kr(ue,k,W),ye.buffers.depth.setTest(!0),ye.buffers.depth.setMask(!0),ye.buffers.color.setMask(!0),ye.setPolygonOffset(!1)}function ph(E,k,W,q){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;g.state.transmissionRenderTarget[q.id]===void 0&&(g.state.transmissionRenderTarget[q.id]=new Rn(1,1,{generateMipmaps:!0,type:Ue.has("EXT_color_buffer_half_float")||Ue.has("EXT_color_buffer_float")?vs:wn,minFilter:pi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:je.workingColorSpace}));let ne=g.state.transmissionRenderTarget[q.id],ue=q.viewport||P;ne.setSize(ue.z*v.transmissionResolutionScale,ue.w*v.transmissionResolutionScale);let _e=v.getRenderTarget(),pe=v.getActiveCubeFace(),Ie=v.getActiveMipmapLevel();v.setRenderTarget(ne),v.getClearColor(U),O=v.getClearAlpha(),O<1&&v.setClearColor(16777215,.5),v.clear(),$e&&Me.render(W);let Ne=v.toneMapping;v.toneMapping=Zn;let Ce=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),g.setupLightsView(q),Ye===!0&&oe.setGlobalState(v.clippingPlanes,q),kr(E,W,q),ke.updateMultisampleRenderTarget(ne),ke.updateRenderTargetMipmap(ne),Ue.has("WEBGL_multisampled_render_to_texture")===!1){let Xe=!1;for(let it=0,_t=k.length;it<_t;it++){let at=k[it],st=at.object,Re=at.geometry,mt=at.material,Ke=at.group;if(mt.side===Ut&&st.layers.test(q.layers)){let Kt=mt.side;mt.side=Gt,mt.needsUpdate=!0,mh(st,W,q,Re,mt,Ke),mt.side=Kt,mt.needsUpdate=!0,Xe=!0}}Xe===!0&&(ke.updateMultisampleRenderTarget(ne),ke.updateRenderTargetMipmap(ne))}v.setRenderTarget(_e,pe,Ie),v.setClearColor(U,O),Ce!==void 0&&(q.viewport=Ce),v.toneMapping=Ne}function kr(E,k,W){let q=k.isScene===!0?k.overrideMaterial:null;for(let V=0,ne=E.length;V<ne;V++){let ue=E[V],_e=ue.object,pe=ue.geometry,Ie=ue.group,Ne=ue.material;Ne.allowOverride===!0&&q!==null&&(Ne=q),_e.layers.test(W.layers)&&mh(_e,k,W,pe,Ne,Ie)}}function mh(E,k,W,q,V,ne){E.onBeforeRender(v,k,W,q,V,ne),E.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),V.onBeforeRender(v,k,W,q,E,ne),V.transparent===!0&&V.side===Ut&&V.forceSinglePass===!1?(V.side=Gt,V.needsUpdate=!0,v.renderBufferDirect(W,k,q,V,E,ne),V.side=Wn,V.needsUpdate=!0,v.renderBufferDirect(W,k,q,V,E,ne),V.side=Ut):v.renderBufferDirect(W,k,q,V,E,ne),E.onAfterRender(v,k,W,q,V,ne)}function Vr(E,k,W){k.isScene!==!0&&(k=Te);let q=be.get(E),V=g.state.lights,ne=g.state.shadowsArray,ue=V.state.version,_e=Y.getParameters(E,V.state,ne,k,W),pe=Y.getProgramCacheKey(_e),Ie=q.programs;q.environment=E.isMeshStandardMaterial?k.environment:null,q.fog=k.fog,q.envMap=(E.isMeshStandardMaterial?vt:At).get(E.envMap||q.environment),q.envMapRotation=q.environment!==null&&E.envMap===null?k.environmentRotation:E.envMapRotation,Ie===void 0&&(E.addEventListener("dispose",K),Ie=new Map,q.programs=Ie);let Ne=Ie.get(pe);if(Ne!==void 0){if(q.currentProgram===Ne&&q.lightsStateVersion===ue)return xh(E,_e),Ne}else _e.uniforms=Y.getUniforms(E),E.onBeforeCompile(_e,v),Ne=Y.acquireProgram(_e,pe),Ie.set(pe,Ne),q.uniforms=_e.uniforms;let Ce=q.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Ce.clippingPlanes=oe.uniform),xh(E,_e),q.needsLights=hf(E),q.lightsStateVersion=ue,q.needsLights&&(Ce.ambientLightColor.value=V.state.ambient,Ce.lightProbe.value=V.state.probe,Ce.directionalLights.value=V.state.directional,Ce.directionalLightShadows.value=V.state.directionalShadow,Ce.spotLights.value=V.state.spot,Ce.spotLightShadows.value=V.state.spotShadow,Ce.rectAreaLights.value=V.state.rectArea,Ce.ltc_1.value=V.state.rectAreaLTC1,Ce.ltc_2.value=V.state.rectAreaLTC2,Ce.pointLights.value=V.state.point,Ce.pointLightShadows.value=V.state.pointShadow,Ce.hemisphereLights.value=V.state.hemi,Ce.directionalShadowMap.value=V.state.directionalShadowMap,Ce.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ce.spotShadowMap.value=V.state.spotShadowMap,Ce.spotLightMatrix.value=V.state.spotLightMatrix,Ce.spotLightMap.value=V.state.spotLightMap,Ce.pointShadowMap.value=V.state.pointShadowMap,Ce.pointShadowMatrix.value=V.state.pointShadowMatrix),q.currentProgram=Ne,q.uniformsList=null,Ne}function gh(E){if(E.uniformsList===null){let k=E.currentProgram.getUniforms();E.uniformsList=As.seqWithValue(k.seq,E.uniforms)}return E.uniformsList}function xh(E,k){let W=be.get(E);W.outputColorSpace=k.outputColorSpace,W.batching=k.batching,W.batchingColor=k.batchingColor,W.instancing=k.instancing,W.instancingColor=k.instancingColor,W.instancingMorph=k.instancingMorph,W.skinning=k.skinning,W.morphTargets=k.morphTargets,W.morphNormals=k.morphNormals,W.morphColors=k.morphColors,W.morphTargetsCount=k.morphTargetsCount,W.numClippingPlanes=k.numClippingPlanes,W.numIntersection=k.numClipIntersection,W.vertexAlphas=k.vertexAlphas,W.vertexTangents=k.vertexTangents,W.toneMapping=k.toneMapping}function lf(E,k,W,q,V){k.isScene!==!0&&(k=Te),ke.resetTextureUnits();let ne=k.fog,ue=q.isMeshStandardMaterial?k.environment:null,_e=R===null?v.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:Ii,pe=(q.isMeshStandardMaterial?vt:At).get(q.envMap||ue),Ie=q.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ne=!!W.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Ce=!!W.morphAttributes.position,Xe=!!W.morphAttributes.normal,it=!!W.morphAttributes.color,_t=Zn;q.toneMapped&&(R===null||R.isXRRenderTarget===!0)&&(_t=v.toneMapping);let at=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,st=at!==void 0?at.length:0,Re=be.get(q),mt=g.state.lights;if(Ye===!0&&($===!0||E!==b)){let Ot=E===b&&q.id===M;oe.setState(q,E,Ot)}let Ke=!1;q.version===Re.__version?(Re.needsLights&&Re.lightsStateVersion!==mt.state.version||Re.outputColorSpace!==_e||V.isBatchedMesh&&Re.batching===!1||!V.isBatchedMesh&&Re.batching===!0||V.isBatchedMesh&&Re.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Re.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Re.instancing===!1||!V.isInstancedMesh&&Re.instancing===!0||V.isSkinnedMesh&&Re.skinning===!1||!V.isSkinnedMesh&&Re.skinning===!0||V.isInstancedMesh&&Re.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Re.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Re.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Re.instancingMorph===!1&&V.morphTexture!==null||Re.envMap!==pe||q.fog===!0&&Re.fog!==ne||Re.numClippingPlanes!==void 0&&(Re.numClippingPlanes!==oe.numPlanes||Re.numIntersection!==oe.numIntersection)||Re.vertexAlphas!==Ie||Re.vertexTangents!==Ne||Re.morphTargets!==Ce||Re.morphNormals!==Xe||Re.morphColors!==it||Re.toneMapping!==_t||Re.morphTargetsCount!==st)&&(Ke=!0):(Ke=!0,Re.__version=q.version);let Kt=Re.currentProgram;Ke===!0&&(Kt=Vr(q,k,V));let Xi=!1,Jt=!1,Bs=!1,gt=Kt.getUniforms(),rn=Re.uniforms;if(ye.useProgram(Kt.program)&&(Xi=!0,Jt=!0,Bs=!0),q.id!==M&&(M=q.id,Jt=!0),Xi||b!==E){ye.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),gt.setValue(N,"projectionMatrix",E.projectionMatrix),gt.setValue(N,"viewMatrix",E.matrixWorldInverse);let qt=gt.map.cameraPosition;qt!==void 0&&qt.setValue(N,xe.setFromMatrixPosition(E.matrixWorld)),Le.logarithmicDepthBuffer&&gt.setValue(N,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&gt.setValue(N,"isOrthographic",E.isOrthographicCamera===!0),b!==E&&(b=E,Jt=!0,Bs=!0)}if(V.isSkinnedMesh){gt.setOptional(N,V,"bindMatrix"),gt.setOptional(N,V,"bindMatrixInverse");let Ot=V.skeleton;Ot&&(Ot.boneTexture===null&&Ot.computeBoneTexture(),gt.setValue(N,"boneTexture",Ot.boneTexture,ke))}V.isBatchedMesh&&(gt.setOptional(N,V,"batchingTexture"),gt.setValue(N,"batchingTexture",V._matricesTexture,ke),gt.setOptional(N,V,"batchingIdTexture"),gt.setValue(N,"batchingIdTexture",V._indirectTexture,ke),gt.setOptional(N,V,"batchingColorTexture"),V._colorsTexture!==null&&gt.setValue(N,"batchingColorTexture",V._colorsTexture,ke));let on=W.morphAttributes;if((on.position!==void 0||on.normal!==void 0||on.color!==void 0)&&ie.update(V,W,Kt),(Jt||Re.receiveShadow!==V.receiveShadow)&&(Re.receiveShadow=V.receiveShadow,gt.setValue(N,"receiveShadow",V.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(rn.envMap.value=pe,rn.flipEnvMap.value=pe.isCubeTexture&&pe.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&k.environment!==null&&(rn.envMapIntensity.value=k.environmentIntensity),Jt&&(gt.setValue(N,"toneMappingExposure",v.toneMappingExposure),Re.needsLights&&cf(rn,Bs),ne&&q.fog===!0&&ee.refreshFogUniforms(rn,ne),ee.refreshMaterialUniforms(rn,q,H,j,g.state.transmissionRenderTarget[E.id]),As.upload(N,gh(Re),rn,ke)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(As.upload(N,gh(Re),rn,ke),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&gt.setValue(N,"center",V.center),gt.setValue(N,"modelViewMatrix",V.modelViewMatrix),gt.setValue(N,"normalMatrix",V.normalMatrix),gt.setValue(N,"modelMatrix",V.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){let Ot=q.uniformsGroups;for(let qt=0,pl=Ot.length;qt<pl;qt++){let bi=Ot[qt];Oe.update(bi,Kt),Oe.bind(bi,Kt)}}return Kt}function cf(E,k){E.ambientLightColor.needsUpdate=k,E.lightProbe.needsUpdate=k,E.directionalLights.needsUpdate=k,E.directionalLightShadows.needsUpdate=k,E.pointLights.needsUpdate=k,E.pointLightShadows.needsUpdate=k,E.spotLights.needsUpdate=k,E.spotLightShadows.needsUpdate=k,E.rectAreaLights.needsUpdate=k,E.hemisphereLights.needsUpdate=k}function hf(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(E,k,W){let q=be.get(E);q.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),be.get(E.texture).__webglTexture=k,be.get(E.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:W,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,k){let W=be.get(E);W.__webglFramebuffer=k,W.__useDefaultFramebuffer=k===void 0};let uf=N.createFramebuffer();this.setRenderTarget=function(E,k=0,W=0){R=E,A=k,C=W;let q=!0,V=null,ne=!1,ue=!1;if(E){let pe=be.get(E);if(pe.__useDefaultFramebuffer!==void 0)ye.bindFramebuffer(N.FRAMEBUFFER,null),q=!1;else if(pe.__webglFramebuffer===void 0)ke.setupRenderTarget(E);else if(pe.__hasExternalTextures)ke.rebindTextures(E,be.get(E.texture).__webglTexture,be.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ce=E.depthTexture;if(pe.__boundDepthTexture!==Ce){if(Ce!==null&&be.has(Ce)&&(E.width!==Ce.image.width||E.height!==Ce.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");ke.setupDepthRenderbuffer(E)}}let Ie=E.texture;(Ie.isData3DTexture||Ie.isDataArrayTexture||Ie.isCompressedArrayTexture)&&(ue=!0);let Ne=be.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ne[k])?V=Ne[k][W]:V=Ne[k],ne=!0):E.samples>0&&ke.useMultisampledRTT(E)===!1?V=be.get(E).__webglMultisampledFramebuffer:Array.isArray(Ne)?V=Ne[W]:V=Ne,P.copy(E.viewport),B.copy(E.scissor),L=E.scissorTest}else P.copy(de).multiplyScalar(H).floor(),B.copy(re).multiplyScalar(H).floor(),L=Ze;if(W!==0&&(V=uf),ye.bindFramebuffer(N.FRAMEBUFFER,V)&&q&&ye.drawBuffers(E,V),ye.viewport(P),ye.scissor(B),ye.setScissorTest(L),ne){let pe=be.get(E.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+k,pe.__webglTexture,W)}else if(ue){let pe=k;for(let Ie=0;Ie<E.textures.length;Ie++){let Ne=be.get(E.textures[Ie]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Ie,Ne.__webglTexture,W,pe)}}else if(E!==null&&W!==0){let pe=be.get(E.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,pe.__webglTexture,W)}M=-1},this.readRenderTargetPixels=function(E,k,W,q,V,ne,ue,_e=0){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=be.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe){ye.bindFramebuffer(N.FRAMEBUFFER,pe);try{let Ie=E.textures[_e],Ne=Ie.format,Ce=Ie.type;if(!Le.textureFormatReadable(Ne)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Le.textureTypeReadable(Ce)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=E.width-q&&W>=0&&W<=E.height-V&&(E.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e),N.readPixels(k,W,q,V,Se.convert(Ne),Se.convert(Ce),ne))}finally{let Ie=R!==null?be.get(R).__webglFramebuffer:null;ye.bindFramebuffer(N.FRAMEBUFFER,Ie)}}},this.readRenderTargetPixelsAsync=async function(E,k,W,q,V,ne,ue,_e=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=be.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&ue!==void 0&&(pe=pe[ue]),pe)if(k>=0&&k<=E.width-q&&W>=0&&W<=E.height-V){ye.bindFramebuffer(N.FRAMEBUFFER,pe);let Ie=E.textures[_e],Ne=Ie.format,Ce=Ie.type;if(!Le.textureFormatReadable(Ne))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Le.textureTypeReadable(Ce))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Xe=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Xe),N.bufferData(N.PIXEL_PACK_BUFFER,ne.byteLength,N.STREAM_READ),E.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+_e),N.readPixels(k,W,q,V,Se.convert(Ne),Se.convert(Ce),0);let it=R!==null?be.get(R).__webglFramebuffer:null;ye.bindFramebuffer(N.FRAMEBUFFER,it);let _t=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await ku(N,_t,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Xe),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,ne),N.deleteBuffer(Xe),N.deleteSync(_t),ne}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,k=null,W=0){let q=Math.pow(2,-W),V=Math.floor(E.image.width*q),ne=Math.floor(E.image.height*q),ue=k!==null?k.x:0,_e=k!==null?k.y:0;ke.setTexture2D(E,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,ue,_e,V,ne),ye.unbindTexture()};let df=N.createFramebuffer(),ff=N.createFramebuffer();this.copyTextureToTexture=function(E,k,W=null,q=null,V=0,ne=null){ne===null&&(V!==0?(us("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),ne=V,V=0):ne=0);let ue,_e,pe,Ie,Ne,Ce,Xe,it,_t,at=E.isCompressedTexture?E.mipmaps[ne]:E.image;if(W!==null)ue=W.max.x-W.min.x,_e=W.max.y-W.min.y,pe=W.isBox3?W.max.z-W.min.z:1,Ie=W.min.x,Ne=W.min.y,Ce=W.isBox3?W.min.z:0;else{let on=Math.pow(2,-V);ue=Math.floor(at.width*on),_e=Math.floor(at.height*on),E.isDataArrayTexture?pe=at.depth:E.isData3DTexture?pe=Math.floor(at.depth*on):pe=1,Ie=0,Ne=0,Ce=0}q!==null?(Xe=q.x,it=q.y,_t=q.z):(Xe=0,it=0,_t=0);let st=Se.convert(k.format),Re=Se.convert(k.type),mt;k.isData3DTexture?(ke.setTexture3D(k,0),mt=N.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(ke.setTexture2DArray(k,0),mt=N.TEXTURE_2D_ARRAY):(ke.setTexture2D(k,0),mt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,k.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,k.unpackAlignment);let Ke=N.getParameter(N.UNPACK_ROW_LENGTH),Kt=N.getParameter(N.UNPACK_IMAGE_HEIGHT),Xi=N.getParameter(N.UNPACK_SKIP_PIXELS),Jt=N.getParameter(N.UNPACK_SKIP_ROWS),Bs=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,at.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,at.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Ie),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ne),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ce);let gt=E.isDataArrayTexture||E.isData3DTexture,rn=k.isDataArrayTexture||k.isData3DTexture;if(E.isDepthTexture){let on=be.get(E),Ot=be.get(k),qt=be.get(on.__renderTarget),pl=be.get(Ot.__renderTarget);ye.bindFramebuffer(N.READ_FRAMEBUFFER,qt.__webglFramebuffer),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,pl.__webglFramebuffer);for(let bi=0;bi<pe;bi++)gt&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,be.get(E).__webglTexture,V,Ce+bi),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,be.get(k).__webglTexture,ne,_t+bi)),N.blitFramebuffer(Ie,Ne,ue,_e,Xe,it,ue,_e,N.DEPTH_BUFFER_BIT,N.NEAREST);ye.bindFramebuffer(N.READ_FRAMEBUFFER,null),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(V!==0||E.isRenderTargetTexture||be.has(E)){let on=be.get(E),Ot=be.get(k);ye.bindFramebuffer(N.READ_FRAMEBUFFER,df),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,ff);for(let qt=0;qt<pe;qt++)gt?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,on.__webglTexture,V,Ce+qt):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,on.__webglTexture,V),rn?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ot.__webglTexture,ne,_t+qt):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Ot.__webglTexture,ne),V!==0?N.blitFramebuffer(Ie,Ne,ue,_e,Xe,it,ue,_e,N.COLOR_BUFFER_BIT,N.NEAREST):rn?N.copyTexSubImage3D(mt,ne,Xe,it,_t+qt,Ie,Ne,ue,_e):N.copyTexSubImage2D(mt,ne,Xe,it,Ie,Ne,ue,_e);ye.bindFramebuffer(N.READ_FRAMEBUFFER,null),ye.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else rn?E.isDataTexture||E.isData3DTexture?N.texSubImage3D(mt,ne,Xe,it,_t,ue,_e,pe,st,Re,at.data):k.isCompressedArrayTexture?N.compressedTexSubImage3D(mt,ne,Xe,it,_t,ue,_e,pe,st,at.data):N.texSubImage3D(mt,ne,Xe,it,_t,ue,_e,pe,st,Re,at):E.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,ne,Xe,it,ue,_e,st,Re,at.data):E.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,ne,Xe,it,at.width,at.height,st,at.data):N.texSubImage2D(N.TEXTURE_2D,ne,Xe,it,ue,_e,st,Re,at);N.pixelStorei(N.UNPACK_ROW_LENGTH,Ke),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Kt),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Xi),N.pixelStorei(N.UNPACK_SKIP_ROWS,Jt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Bs),ne===0&&k.generateMipmaps&&N.generateMipmap(mt),ye.unbindTexture()},this.initRenderTarget=function(E){be.get(E).__webglFramebuffer===void 0&&ke.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?ke.setTextureCube(E,0):E.isData3DTexture?ke.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?ke.setTexture2DArray(E,0):ke.setTexture2D(E,0),ye.unbindTexture()},this.resetState=function(){A=0,C=0,R=null,ye.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=je._getDrawingBufferColorSpace(e),t.unpackColorSpace=je._getUnpackColorSpace()}};var Tr=new F;function hn(r,e,t,n,i,s){let o=2*Math.PI*i/4,l=Math.max(s-2*i,0),c=Math.PI/4;Tr.copy(e),Tr[n]=0,Tr.normalize();let h=.5*o/(o+l),a=1-Tr.angleTo(r)/c;return Math.sign(Tr[t])===1?a*h:l/(o+l)+h+h*(1-a)}var Ha=class r extends yn{constructor(e=1,t=1,n=1,i=2,s=.1){let o=i*2+1;if(s=Math.min(e/2,t/2,n/2,s),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:i,radius:s},o===1)return;let l=this.toNonIndexed();this.index=null,this.attributes.position=l.attributes.position,this.attributes.normal=l.attributes.normal,this.attributes.uv=l.attributes.uv;let c=new F,h=new F,a=new F(e,t,n).divideScalar(2).subScalar(s),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,m=u.length/6,x=new F,p=.5/o;for(let g=0,_=0;g<u.length;g+=3,_+=2)switch(c.fromArray(u,g),h.copy(c),h.x-=Math.sign(h.x)*p,h.y-=Math.sign(h.y)*p,h.z-=Math.sign(h.z)*p,h.normalize(),u[g+0]=a.x*Math.sign(c.x)+h.x*s,u[g+1]=a.y*Math.sign(c.y)+h.y*s,u[g+2]=a.z*Math.sign(c.z)+h.z*s,d[g+0]=h.x,d[g+1]=h.y,d[g+2]=h.z,Math.floor(g/m)){case 0:x.set(1,0,0),f[_+0]=hn(x,h,"z","y",s,n),f[_+1]=1-hn(x,h,"y","z",s,t);break;case 1:x.set(-1,0,0),f[_+0]=1-hn(x,h,"z","y",s,n),f[_+1]=1-hn(x,h,"y","z",s,t);break;case 2:x.set(0,1,0),f[_+0]=1-hn(x,h,"x","z",s,e),f[_+1]=hn(x,h,"z","x",s,n);break;case 3:x.set(0,-1,0),f[_+0]=1-hn(x,h,"x","z",s,e),f[_+1]=1-hn(x,h,"z","x",s,n);break;case 4:x.set(0,0,1),f[_+0]=1-hn(x,h,"x","y",s,e),f[_+1]=1-hn(x,h,"y","x",s,t);break;case 5:x.set(0,0,-1),f[_+0]=hn(x,h,"x","y",s,e),f[_+1]=1-hn(x,h,"y","x",s,t);break}}static fromJSON(e){return new r(e.width,e.height,e.depth,e.segments,e.radius)}};function yd(r,e=!1){let t=r[0].index!==null,n=new Set(Object.keys(r[0].attributes)),i=new Set(Object.keys(r[0].morphAttributes)),s={},o={},l=r[0].morphTargetsRelative,c=new Bt,h=0;for(let a=0;a<r.length;++a){let u=r[a],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". Make sure all geometries have the same number of attributes."),null;if(l!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in u.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(u.morphAttributes[f])}if(e){let f;if(t)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+a+". The geometry must have either an index or a position attribute"),null;c.addGroup(h,f,a),h+=f}}if(t){let a=0,u=[];for(let d=0;d<r.length;++d){let f=r[d].index;for(let m=0;m<f.count;++m)u.push(f.getX(m)+a);a+=r[d].attributes.position.count}c.setIndex(u)}for(let a in s){let u=vd(s[a]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+a+" attribute."),null;c.setAttribute(a,u)}for(let a in o){let u=o[a][0].length;if(u===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[a]=[];for(let d=0;d<u;++d){let f=[];for(let x=0;x<o[a].length;++x)f.push(o[a][x][d]);let m=vd(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+a+" morphAttribute."),null;c.morphAttributes[a].push(m)}}return c}function vd(r){let e,t,n,i=-1,s=0;for(let h=0;h<r.length;++h){let a=r[h];if(e===void 0&&(e=a.array.constructor),e!==a.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=a.itemSize),t!==a.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=a.normalized),n!==a.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=a.gpuType),i!==a.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=a.count*t}let o=new e(s),l=new Ft(o,t,n),c=0;for(let h=0;h<r.length;++h){let a=r[h];if(a.isInterleavedBufferAttribute){let u=c/t;for(let d=0,f=a.count;d<f;d++)for(let m=0;m<t;m++){let x=a.getComponent(d,m);l.setComponent(d+u,m,x)}}else o.set(a.array,c);c+=a.count*t}return i!==void 0&&(l.gpuType=i),l}var J={ink:"#202d36",blue:"#234ce7",yellow:"#ffda44",paper:"#fff7df",coral:"#f0805e",mint:"#90b9a1",metal:"#567581",dark:"#324b59"},Es=new Map,Oc=new Map;function un(r,e=!1){let t=`${r}:${e}`;if(!Es.has(t)){let n=new Ni({color:r,roughness:.72,metalness:.08,emissive:e?r:"#000000",emissiveIntensity:e?.6:0});n.userData.shared=!0,Es.set(t,n)}return Es.get(t)}function Cr(r,e){if(!Oc.has(r)){let t=e();t.userData.shared=!0,Oc.set(r,t)}return Oc.get(r)}var s_=()=>Cr("box",()=>new Ha(1,1,1,2,.09)),r_=()=>Cr("cylinder",()=>new cr(1,1,1,24)),o_=()=>Cr("sphere",()=>new Li(1,20,12)),bd=()=>Cr("plane",()=>new Yn(1,1));function Gi(r,e,t,n,i,s,o=1,l=1,c=1){let h=new ht(e,typeof t=="string"?un(t):t);return h.position.set(n,i,s),h.scale.set(o,l,c),h.castShadow=!0,h.receiveShadow=!0,r.add(h),h}var Fe=(r,e,t,n,i,s,o,l)=>Gi(r,s_(),e,t,n,i,s,o,l),pt=(r,e,t,n,i,s,o)=>Gi(r,r_(),e,t,n,i,s,o,s),gi=(r,e,t,n,i,s)=>Gi(r,o_(),e,t,n,i,s,s,s);function Ga(r,e,t,n,i,s,o=.08){let l=Cr(`torus:${s}:${o}`,()=>new fr(s,o,6,36));return Gi(r,l,e,t,n,i)}function Vc(r,e,t,n,i,s=.055){let o=Ga(r,e,t,.035,n,i,s);return o.rotation.x=-Math.PI/2,o.castShadow=!1,o}function kc(r,e,t,n=.15){let i=new xs(t.map(o=>new F(...o))),s=new pr(i,Math.max(12,t.length*6),n,6,!1);return Gi(r,s,e,0,0,0)}function Er(r,e,t,n,i,s=3,o=.7,l=J.paper,c=J.ink){let h=document.createElement("canvas");h.width=512,h.height=Math.max(64,Math.round(512*o/s));let a=h.getContext("2d");a.fillStyle=l,a.fillRect(0,0,h.width,h.height),a.fillStyle=c,a.textAlign="center",a.textBaseline="middle",a.font=`800 ${Math.round(h.height*.63)}px Arial`,a.fillText(e,256,h.height*.52,480);let u=new gs(h);u.colorSpace=Rt;let d=new Ht({map:u,side:Ut});return Gi(r,bd(),d,t,n,i,s,o,1)}function Cs(r){r.updateWorldMatrix(!0,!0);let e=r.matrixWorld.clone().invert(),t=new Map;r.traverse(n=>{if(!n.isMesh)return;let i=n.material,s=i.uuid;t.has(s)||t.set(s,{material:i,geos:[]});let o=new rt().multiplyMatrices(e,n.matrixWorld),l=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();t.get(s).geos.push(l.applyMatrix4(o))}),r.clear();for(let{material:n,geos:i}of t.values()){let s=yd(i,!1);i.forEach(l=>l.dispose());let o=new ht(s,n);o.castShadow=!0,o.receiveShadow=!0,r.add(o)}return r}function a_(r,e,t,n){pt(r,J.dark,e,t,n,.075,.07),Fe(r,J.paper,e,t+.039,n,.06,.009,.013)}function l_(r,e,t,n=1){pt(r,J.coral,e,.27,t,.55*n,.5),pt(r,"#455c47",e,.54,t,.44*n,.03);for(let i=0;i<4;i++){let s=i*2.4,o=pt(r,"#618263",e+Math.cos(s)*.15,.9+i*.09,t+Math.sin(s)*.15,.045,.8);o.rotation.z=Math.sin(s)*.28;let l=gi(r,i%2?"#91ad72":"#6c976c",e+Math.cos(s)*.32,1.25+i*.09,t+Math.sin(s)*.32,.29*n);l.scale.y*=1.65,l.rotation.z=s*.3}}function c_(r,e){Fe(r,J.metal,e.x,.58,e.z,e.w*.92,1.15,e.d*.92),Fe(r,J.paper,e.x,1.18,e.z,e.w*.87,.16,e.d*.87);for(let n of[-.34,.34])Fe(r,J.yellow,e.x+e.w*n,.69,e.z,e.w*.07,1.35,e.d*.98);let t=Er(r,"CAUTION",e.x,.55,e.z+e.d*.465,Math.min(1.65,e.w*.65),.3,J.yellow);t.rotation.y=0}function h_(r,e,t){let n=Math.min(e.w,e.d)*.4;Fe(r,J.dark,e.x,.2,e.z,e.w,.4,e.d);let i=e.d>4?2:1;for(let s=0;s<i;s++){let o=e.z+(s-(i-1)/2)*e.d*.46;pt(r,J.paper,e.x,1.2,o,n,2.1),pt(r,J.blue,e.x,.36,o,n*1.05,.18),pt(r,J.blue,e.x,2.18,o,n*1.03,.18);let l=gi(r,J.mint,e.x,2.24,o,n*.86);l.scale.y=.33;for(let h=0;h<4;h++)Fe(r,J.dark,e.x-n*.68+h*n*.45,1.1,o+n*.96,.12,.8,.075);kc(r,J.coral,[[e.x+n*.7,2.2,o],[e.x+n*1.1,2.5,o],[e.x+n*1.35,1.6,o],[e.x+n*1.35,.2,o]],.1);let c=new ct;c.position.set(e.x,2.52,o),pt(c,J.dark,0,0,0,.16,.18);for(let h=0;h<4;h++){let a=Fe(c,J.blue,Math.sin(h*Math.PI/2)*n*.4,0,Math.cos(h*Math.PI/2)*n*.4,n*.6,.045,.22);a.rotation.y=-h*Math.PI/2}Cs(c),t.add(c),c.userData.spin=.7}}function u_(r,e,t){Fe(r,J.paper,e.x,.2,e.z,e.w,.4,e.d),Fe(r,J.blue,e.x,1,e.z,e.w*.9,1.7,e.d*.83),pt(r,J.yellow,e.x,1.91,e.z,1.65,.22),pt(r,J.dark,e.x,2.05,e.z,1.38,.18);let n=new ct;n.position.set(e.x,2.2,e.z),pt(n,J.paper,0,0,0,.4,.3);for(let s=0;s<6;s++){let o=s*Math.PI/3,l=Fe(n,J.mint,Math.sin(o)*.8,0,Math.cos(o)*.8,.6,.15,.9);l.rotation.y=o+.4}Cs(n),t.add(n),n.userData.spin=.6;let i=Er(r,"O\u2014Y / POWER WORKS",e.x,1,e.z+e.d*.422,3,.55);i.rotation.y=0;for(let s=0;s<3;s++)pt(r,J.dark,e.x-1.6+s*.42,1.9,e.z-1.1,.11,.45)}function wd(r){let e=new ct,t=new ct,n=new ct;e.add(t,n);let i=t;Fe(i,J.dark,0,-1.75,0,28.1,.65,24.1),Fe(i,r.edge,0,-.95,0,28,1.1,24),Fe(i,r.color,0,-.18,0,28.15,.42,24.15);for(let c=-12;c<=12;c+=3)Fe(i,J.dark,c,-1.06,12.01,1.5,.6,.08),Fe(i,J.paper,c,-.92,12.08,.09,.3,.03);for(let c=-9;c<=9;c+=3)Fe(i,J.dark,14.01,-1,c,.08,.6,1.2);Fe(i,"#cbd0af",-10,.045,0,2.6,.035,21),Fe(i,"#cbd0af",0,.046,8,24,.03,2.6),Fe(i,"#cbd0af",10,.047,-2,2.6,.03,16);for(let c=-10;c<=10;c+=1.4)Fe(i,J.paper,-8.55,.07,c,.06,.025,.55);for(let c=-12;c<=12;c+=1.4)Fe(i,J.paper,c,.07,6.55,.55,.025,.06);for(let c=-7;c<=7;c+=7)Fe(i,"#8fa48e",c,.047,-1,.018,.016,20);for(let c=-12;c<=12;c+=4)for(let h of[-11.5,11.5])Fe(i,J.dark,c,.19,h,.42,.35,.4),Fe(i,J.yellow,c,.4,h,.38,.08,.36),a_(i,c,.05,h+.65);for(let c of[-13.5,13.5])for(let h=-8;h<=8;h+=4)pt(i,J.paper,c,.25,h,.11,.55),gi(i,J.yellow,c,.6,h,.12);kc(i,J.blue,[[-12,-.4,12.3],[-8,-.4,12.4],[-7,-.9,12.4],[-1,-.9,12.4],[0,-.4,12.4],[8,-.4,12.4]],.12),kc(i,J.coral,[[14.3,-.1,-8],[14.4,-.1,-3],[14.4,-1.3,-1],[14.4,-1.3,7]],.17);for(let c of r.obstacles)c.type==="tank"?h_(i,c,n):c.type==="turbine"?u_(i,c,n):c_(i,c);let s=Er(i,`SKIFT / ${r.number}`,0,-.94,12.105,4,.75,J.paper);s.rotation.y=0;let o=Er(i,r.number,-5,.085,-3,3.1,2.1,r.color,r.edge);o.rotation.x=-Math.PI/2;for(let[c,h]of[[-12.5,-10.5],[12.4,10.3],[-12.7,10.6],[12.2,-10.7]])l_(i,c,h,.8);let l=Ga(i,J.coral,-11,2.2,-12.6,1.55,.24);l.rotation.y=.3,pt(i,J.dark,-11,.4,-12.6,.75,.7);for(let c of r.hazards){Fe(i,J.dark,c.x,.06,c.z,c.w+.25,.12,c.d+.3);for(let h=c.x-c.w/2;h<c.x+c.w/2;h+=.6){let a=Fe(i,J.yellow,h,.14,c.z,.25,.015,c.d+.24);a.rotation.y=.45}}return Cs(t),{root:e,staticArt:t,dynamicArt:n}}function Md(r,e=1.35){let t="blob";if(!Es.has(t)){let i=document.createElement("canvas");i.width=i.height=64;let s=i.getContext("2d"),o=s.createRadialGradient(32,32,2,32,32,31);o.addColorStop(0,"rgba(23,39,34,.32)"),o.addColorStop(1,"rgba(23,39,34,0)"),s.fillStyle=o,s.fillRect(0,0,64,64);let l=new Ht({map:new gs(i),transparent:!0,depthWrite:!1});l.userData.shared=!0,Es.set(t,l)}let n=Gi(r,bd(),Es.get(t),0,.065,0,e,e,1);return n.rotation.x=-Math.PI/2,n.castShadow=!1,n}function Sd(){let r=new ct,e=new ct;r.add(e),Fe(e,J.blue,0,.8,0,.84,.9,.7),gi(e,J.paper,0,1.08,.02,.43).scale.y=.57,Fe(e,J.dark,0,.97,.353,.65,.29,.08);for(let n of[-.18,.18])Fe(e,un("#dcfcf0",!0),n,.99,.403,.13,.065,.03);Fe(e,J.yellow,0,.75,.38,.15,.12,.045),Fe(e,J.coral,0,.77,-.41,.52,.6,.2);for(let n of[-.53,.53])gi(e,J.paper,n,.75,0,.16),Fe(e,J.blue,n,.5,.04,.21,.3,.22);for(let n of[-.33,.33]){let i=pt(e,J.dark,n,.23,0,.25,.19);i.rotation.z=Math.PI/2;let s=pt(e,J.paper,n+(n<0?-.11:.11),.23,0,.11,.02);s.rotation.z=Math.PI/2}pt(e,J.dark,.22,1.45,-.08,.025,.58),gi(e,un(J.yellow,!0),.22,1.76,-.08,.105),Cs(e),r.userData.body=e,Md(r),r.traverse(n=>{n.isMesh&&(n.castShadow=!1)});let t=Vc(r,J.blue,0,0,.67,.035);return r.userData.halo=t,r}function Ad(r){let e=new ct,t=new ct;e.add(t);let n=r==="shooter"?J.yellow:r==="charger"?J.coral:"#d97157",i=r==="charger"?1.15:.9;pt(t,J.dark,0,.3,0,.42*i,.2),gi(t,n,0,.77,0,.54*i).scale.y=.8,Fe(t,J.dark,0,.84,.45*i,.67*i,.2,.09),Fe(t,un("#fff0ca",!0),0,.84,.52*i,r==="charger"?.4:.18,.07,.02);for(let s of[-.54,.54])Fe(t,J.dark,s*i,.55,0,.17,.17,.68);if(r==="shooter"){let s=pt(t,J.dark,0,.83,.65,.095,.5);s.rotation.x=Math.PI/2}if(r==="charger")for(let s of[-.35,.35])Fe(t,J.paper,s,1.16,.3,.13,.35,.12);return Cs(t),e.userData.body=t,Md(e,1.5),e.traverse(s=>{s.isMesh&&(s.castShadow=!1)}),e}function Td(){let r=new ct;pt(r,J.dark,0,.14,0,.55,.22),Vc(r,J.blue,0,0,.76,.065);let e=new ct;return e.position.y=.4,r.add(e),Fe(e,J.blue,0,.5,0,.55,.8,.55),Fe(e,J.paper,0,.94,0,.42,.08,.42),Fe(e,un(J.yellow,!0),0,.5,.3,.2,.42,.028),Fe(e,J.paper,0,.09,0,.42,.08,.42),Cs(e),r.userData.body=e,r}function Ed(){let r=new ct,e=Ga(r,J.yellow,0,.6,0,.18,.07);return r.userData.body=e,r}function Cd(){let r=new ct;pt(r,J.dark,0,.08,0,1.3,.14),pt(r,J.paper,0,.18,0,1.08,.1);let e=Vc(r,J.blue,0,0,1.5,.07);for(let n of[-1.35,1.35])Fe(r,J.blue,n,1.1,0,.22,2.2,.24),Fe(r,J.paper,n,1.15,.145,.06,1.6,.025);Fe(r,J.blue,0,2.18,0,2.85,.26,.24);let t=Er(r,"\u2192",0,2.19,.14,1.15,.6,J.yellow);return r.userData.ring=e,r.userData.flag=t,r}function Rd(){let r=new ct,e=new ct;r.add(e),pt(r,J.dark,0,.35,0,1.75,.65),pt(r,J.paper,0,.71,0,1.64,.12);let t=gi(r,un(J.coral,!0),0,1.85,0,.88);r.userData.core=t;for(let n=0;n<3;n++)Ga(e,n===1?J.yellow:J.blue,0,1.85,0,1.15+n*.23,.13).rotation.set(n*.8+.35,n*1.1,.35);for(let n=0;n<4;n++){let i=n*Math.PI/2;Fe(r,J.blue,Math.sin(i)*1.45,1.25,Math.cos(i)*1.45,.45,2.3,.45)}return r.userData.rotor=e,r}function Id(r){let e=new Set,t=new Set;r.traverse(n=>{n.geometry&&!n.geometry.userData.shared&&e.add(n.geometry),n.material&&!n.material.userData.shared&&t.add(n.material)}),e.forEach(n=>n.dispose()),t.forEach(n=>{n.map?.dispose(),n.dispose()}),r.clear()}var Wa=class{constructor(e,t){this.container=e,this.settings=t,this.renderer=new ka({antialias:!0,alpha:!1,powerPreference:"low-power"}),this.renderer.outputColorSpace=Rt,this.renderer.toneMapping=Ko,this.renderer.toneMappingExposure=1.35,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Go,this.renderer.shadowMap.autoUpdate=!1,e.append(this.renderer.domElement),this.renderer.domElement.setAttribute("aria-label","SKIFT \u2014 spelv\xE4rld"),this.scene=new rr,this.camera=new Fi(-20,20,15,-15,.1,150),this.target=new F,this.offset=new F(22,29,22),this.projected=new F,this.scene.add(new xr("#fff5de","#607883",2.3));let n=new _r("#fff3d6",3.2);n.position.set(-12,25,16),n.castShadow=!0,n.shadow.mapSize.set(1024,1024),Object.assign(n.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:65}),n.shadow.bias=-5e-4,n.shadow.normalBias=.04,n.shadow.radius=3,this.scene.add(n),this.sun=n,this.ground=new ht(new Yn(200,200),new Ni({color:"#e9e2d1",roughness:1})),this.ground.rotation.x=-Math.PI/2,this.ground.position.y=-2.2,this.ground.receiveShadow=!0,this.scene.add(this.ground),this.scene.fog=new sr("#e9e2d1",65,120),this.world=null,this.hero=null,this.time=0,this.shake=0,this.mode="menu",this.particleData=[];let i=new dr(.11);this.particles=new or(i,new Ht({color:"#ffffff"}),64),this.particles.instanceMatrix.setUsage(pc),this.particles.frustumCulled=!1,this.particles.count=0,this.scene.add(this.particles),this.matrix=new Et,this.tempColor=new Ge,this.rings=[];for(let s=0;s<8;s++){let o=new ht(new Pi(.94,1,64),new Ht({color:J.blue,transparent:!0,opacity:.8,side:Ut,depthWrite:!1}));o.rotation.x=-Math.PI/2,o.visible=!1,this.scene.add(o),this.rings.push({mesh:o,life:0})}this.resize()}resize(){if(this.width=this.container.clientWidth,this.height=this.container.clientHeight,!this.width||!this.height)return;let e=`${this.width}x${this.height}:${this.settings.quality}`;if(e===this.sizeKey)return;this.sizeKey=e;let t=this.settings.quality==="smooth"?52e5:1e6,n=Math.min(this.settings.quality==="smooth"?Math.min(devicePixelRatio||1,2):1,Math.sqrt(t/(this.width*this.height)));this.renderer.setPixelRatio(n),this.renderer.setSize(this.width,this.height,!1),this.setCamera(this.mode,this.mode==="menu",null,0),this.world&&this.renderer.render(this.scene,this.camera)}setCamera(e,t=!1,n=null,i=1/30){let s=this.width/this.height,o=s<.95,l=e==="menu"?o?53:36:o?31:25;this.camera.left=-l*s/2,this.camera.right=l*s/2,this.camera.top=l/2,this.camera.bottom=-l/2,this.camera.updateProjectionMatrix();let c=0,h=0,a=0;e==="menu"?(c=o?-.5:-7,h=o?.5:7,a=o?7:0):n&&(c=Math.max(-8,Math.min(8,n.x*.76)),h=Math.max(-6,Math.min(6,n.z*.76)));let u=new F(c,a,h);t?this.target.copy(u):this.target.lerp(u,1-Math.exp(-i*5)),this.camera.position.copy(this.target).add(this.offset),this.settings.motion&&this.shake>0&&(this.camera.position.x+=Math.sin(this.time*73)*this.shake,this.camera.position.z+=Math.cos(this.time*53)*this.shake),this.camera.lookAt(this.target)}load(e){this.world&&(this.scene.remove(this.world),Id(this.world)),this.level=e,this.world=new ct,this.scene.add(this.world);let t=wd(e);this.world.add(t.root),this.dynamic=t.dynamicArt,this.dynamic.traverse(i=>{i.isMesh&&(i.castShadow=!1)}),this.hero=Sd(),this.hero.position.set(e.start[0],0,e.start[1]),this.world.add(this.hero),this.cellModels=e.cells.map(([i,s])=>{let o=Td();return o.position.set(i,0,s),this.world.add(o),o}),this.scrapModels=e.scrap.map(([i,s])=>{let o=Ed();return o.position.set(i,0,s),this.world.add(o),o}),this.exit=Cd(),this.exit.position.set(e.exit[0],0,e.exit[1]),this.world.add(this.exit),this.boss=e.boss?Rd():null,this.boss&&(this.boss.position.set(e.boss[0],0,e.boss[1]),this.world.add(this.boss)),this.enemyModels=[],this.telegraphs=[],this.bulletModels=[];let n=new Li(.15,8,6);for(let i=0;i<32;i++){let s=new ht(n,un(J.coral,!0));s.visible=!1,this.world.add(s),this.bulletModels.push(s)}this.hazardModels=e.hazards.map(i=>{let s=new ht(new yn(i.w,.11,i.d),new Ht({color:"#f08b51",transparent:!0,opacity:.3}));return s.position.set(i.x,.22,i.z),this.world.add(s),s}),this.bossRing=new ht(new Pi(.975,1,80),new Ht({color:"#e76441",transparent:!0,opacity:.8,side:Ut,depthWrite:!1})),this.bossRing.rotation.x=-Math.PI/2,this.bossRing.visible=!1,this.world.add(this.bossRing),this.particleData.length=0,this.rings.forEach(i=>{i.life=0,i.mesh.visible=!1}),this.ground.material.color.set(e.ground),this.scene.background=new Ge(e.ground),this.scene.fog.color.set(e.ground),this.renderer.shadowMap.needsUpdate=!0,this.mode="menu",this.setCamera("menu",!0)}addEnemy(e){let t=Ad(e.type);t.position.set(e.body.position.x,0,e.body.position.z),this.world.add(t),e.visual=t;let n=new ht(new Pi(.91,1,40),new Ht({color:"#d24d29",transparent:!0,opacity:0,side:Ut,depthWrite:!1}));n.rotation.x=-Math.PI/2,this.world.add(n),e.tell=n,this.enemyModels.push(t);let i=new ht(new yn(.07,.015,5),new Ht({color:"#d45c31",transparent:!0,opacity:.45,depthWrite:!1}));i.visible=!1,this.world.add(i),e.beam=i}burst(e,t,n=J.yellow,i=12){this.settings.motion||(i=Math.min(i,4));for(let s=0;s<i&&this.particleData.length<64;s++){let o=Math.random()*Math.PI*2,l=1+Math.random()*3;this.particleData.push({x:e,y:.7,z:t,vx:Math.cos(o)*l,vz:Math.sin(o)*l,vy:2+Math.random()*3,life:.35+Math.random()*.35,color:n})}}wave(e,t,n=J.blue,i=3.5,s=.45){let o=this.rings.find(l=>l.life<=0)||this.rings[0];Object.assign(o,{life:s,max:s,radius:i}),o.mesh.position.set(e,.08,t),o.mesh.material.color.set(n),o.mesh.visible=!0,o.mesh.scale.setScalar(.1)}draw(e,t,n,i){this.time=i,this.mode=t;let s=t==="play",o=s||t==="menu",l=e?.state,c=e?.player?.position;if(this.shake=Math.max(0,this.shake-n*1.5),this.setCamera(t==="menu"?"menu":"play",!1,c,n),o&&this.settings.motion)for(let h of this.dynamic.children)h.rotation.y+=n*(h.userData.spin||0);if(e){this.hero.position.set(c.x,0,c.z);let h=this.hero.userData.body,a=xc.euclideanModulo(e.facing-this.hero.rotation.y+Math.PI,Math.PI*2)-Math.PI;this.hero.rotation.y+=a*(1-Math.exp(-n*18)),this.settings.motion?(h.position.y=e.moving?Math.abs(Math.sin(i*19))*.075:Math.sin(i*3)*.026,h.rotation.x=l.dashing>0?-.18:0):(h.position.y=0,h.rotation.x=0),h.visible=!0;let u=s&&l.invulnerable>0&&this.settings.motion&&Math.floor(i*8)%2===0;this.hero.userData.halo.material=un(u?J.coral:J.blue),l.dashing>0&&this.settings.motion&&Math.random()>.3&&this.burst(c.x,c.z,J.blue,1);for(let f=0;f<this.cellModels.length;f++){let m=this.cellModels[f];m.visible=!l.cells.has(`cell-${f}`),o&&this.settings.motion&&(m.userData.body.rotation.y=i*.9+f,m.userData.body.position.y=.4+Math.sin(i*2+f)*.08)}for(let f=0;f<this.scrapModels.length;f++){let m=this.scrapModels[f];m.visible=!e.scrap.has(f),this.settings.motion&&(m.rotation.y=i*1.8+f)}for(let f of e.enemies){if(f.dead){f.visual.visible=!1,f.tell.visible=!1,f.beam.visible=!1;continue}f.visual.position.set(f.body.position.x,0,f.body.position.z),f.visual.rotation.y=f.facing||0,f.visual.userData.body.position.y=this.settings.motion?Math.sin(i*4+f.seed)*.045:0,f.tell.visible=f.telegraph>0,f.tell.material.opacity=f.telegraph>0?.25+.5*(1-f.telegraph/.9):0,f.tell.position.set(f.body.position.x,.09,f.body.position.z),f.tell.scale.setScalar(f.type==="charger"?1.2:1),f.beam.visible=f.telegraph>0,f.beam.position.set(f.body.position.x+f.aim.x*2.5,.11,f.body.position.z+f.aim.z*2.5),f.beam.rotation.y=Math.atan2(f.aim.x,f.aim.z),f.telegraph>0&&(f.visual.rotation.y=f.beam.rotation.y),f.stunned>0?f.visual.rotation.z=Math.sin(i*27)*.13:f.visual.rotation.z=0}for(let f=0;f<this.bulletModels.length;f++){let m=this.bulletModels[f],x=e.bullets[f];m.visible=!!x,x&&(m.position.set(x.x,.65,x.z),m.material=un(x.friendly?J.blue:J.coral,!0))}for(let f=0;f<this.hazardModels.length;f++){let m=e.hazardActive(f),x=this.hazardModels[f];x.material.opacity=m?.8:.13,x.scale.y=m?6:1}let d=l.cells.size===3&&(!e.bossState||l.bossDefeated);if(this.exit.userData.ring.material=un(d?J.blue:J.metal,!0),this.settings.motion&&this.exit.userData.ring.scale.setScalar(d?1+Math.sin(i*3)*.08:1),this.boss){let f=e.bossState;this.boss.visible=!l.bossDefeated,this.settings.motion&&(this.boss.userData.rotor.rotation.y=i*(f?.vulnerable>0?2:.55)),this.boss.userData.core.material=un(f?.vulnerable>0?J.yellow:J.coral,!0),this.bossRing.visible=(!!f?.waveRadius||f?.active&&f.timer<1)&&!l.bossDefeated,this.bossRing.visible&&(this.bossRing.position.set(f.x,.1,f.z),this.bossRing.scale.setScalar(f.waveRadius||2+(1-f.timer)*1.2))}}for(let h=this.particleData.length-1;h>=0;h--){let a=this.particleData[h];if(a.life-=n,a.life<=0){this.particleData.splice(h,1);continue}a.x+=a.vx*n,a.z+=a.vz*n,a.y+=a.vy*n,a.vy-=13*n}this.particles.count=this.particleData.length;for(let h=0;h<this.particleData.length;h++){let a=this.particleData[h];this.matrix.position.set(a.x,Math.max(.08,a.y),a.z),this.matrix.scale.setScalar(Math.min(1,a.life*6)),this.matrix.rotation.set(a.life*3,a.life*7,0),this.matrix.updateMatrix(),this.particles.setMatrixAt(h,this.matrix.matrix),this.particles.setColorAt(h,this.tempColor.set(a.color))}this.particles.instanceMatrix.needsUpdate=!0,this.particles.instanceColor&&(this.particles.instanceColor.needsUpdate=!0);for(let h of this.rings)h.life=Math.max(0,h.life-n),h.mesh.visible=h.life>0,h.life>0&&(h.mesh.scale.setScalar((1-h.life/h.max)*h.radius+.1),h.mesh.material.opacity=h.life/h.max*.8);this.renderer.render(this.scene,this.camera)}project(e,t,n=1){return this.projected.set(e,n,t).project(this.camera),{x:(this.projected.x*.5+.5)*this.width,y:(-.5*this.projected.y+.5)*this.height}}stats(){let e=this.renderer.info;return{drawCalls:e.render.calls,triangles:e.render.triangles,geometries:e.memory.geometries,textures:e.memory.textures,width:this.renderer.domElement.width,height:this.renderer.domElement.height,pixelRatio:this.renderer.getPixelRatio()}}};var _i=class r{constructor(e){e===void 0&&(e=[0,0,0,0,0,0,0,0,0]),this.elements=e}identity(){let e=this.elements;e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1}setZero(){let e=this.elements;e[0]=0,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=0,e[6]=0,e[7]=0,e[8]=0}setTrace(e){let t=this.elements;t[0]=e.x,t[4]=e.y,t[8]=e.z}getTrace(e){e===void 0&&(e=new S);let t=this.elements;return e.x=t[0],e.y=t[4],e.z=t[8],e}vmult(e,t){t===void 0&&(t=new S);let n=this.elements,i=e.x,s=e.y,o=e.z;return t.x=n[0]*i+n[1]*s+n[2]*o,t.y=n[3]*i+n[4]*s+n[5]*o,t.z=n[6]*i+n[7]*s+n[8]*o,t}smult(e){for(let t=0;t<this.elements.length;t++)this.elements[t]*=e}mmult(e,t){t===void 0&&(t=new r);let n=this.elements,i=e.elements,s=t.elements,o=n[0],l=n[1],c=n[2],h=n[3],a=n[4],u=n[5],d=n[6],f=n[7],m=n[8],x=i[0],p=i[1],g=i[2],_=i[3],y=i[4],v=i[5],T=i[6],A=i[7],C=i[8];return s[0]=o*x+l*_+c*T,s[1]=o*p+l*y+c*A,s[2]=o*g+l*v+c*C,s[3]=h*x+a*_+u*T,s[4]=h*p+a*y+u*A,s[5]=h*g+a*v+u*C,s[6]=d*x+f*_+m*T,s[7]=d*p+f*y+m*A,s[8]=d*g+f*v+m*C,t}scale(e,t){t===void 0&&(t=new r);let n=this.elements,i=t.elements;for(let s=0;s!==3;s++)i[3*s+0]=e.x*n[3*s+0],i[3*s+1]=e.y*n[3*s+1],i[3*s+2]=e.z*n[3*s+2];return t}solve(e,t){t===void 0&&(t=new S);let n=3,i=4,s=[],o,l;for(o=0;o<n*i;o++)s.push(0);for(o=0;o<3;o++)for(l=0;l<3;l++)s[o+i*l]=this.elements[o+3*l];s[3]=e.x,s[7]=e.y,s[11]=e.z;let c=3,h=c,a,u=4,d;do{if(o=h-c,s[o+i*o]===0){for(l=o+1;l<h;l++)if(s[o+i*l]!==0){a=u;do d=u-a,s[d+i*o]+=s[d+i*l];while(--a);break}}if(s[o+i*o]!==0)for(l=o+1;l<h;l++){let f=s[o+i*l]/s[o+i*o];a=u;do d=u-a,s[d+i*l]=d<=o?0:s[d+i*l]-s[d+i*o]*f;while(--a)}}while(--c);if(t.z=s[2*i+3]/s[2*i+2],t.y=(s[1*i+3]-s[1*i+2]*t.z)/s[1*i+1],t.x=(s[0*i+3]-s[0*i+2]*t.z-s[0*i+1]*t.y)/s[0*i+0],isNaN(t.x)||isNaN(t.y)||isNaN(t.z)||t.x===1/0||t.y===1/0||t.z===1/0)throw`Could not solve equation! Got x=[${t.toString()}], b=[${e.toString()}], A=[${this.toString()}]`;return t}e(e,t,n){if(n===void 0)return this.elements[t+3*e];this.elements[t+3*e]=n}copy(e){for(let t=0;t<e.elements.length;t++)this.elements[t]=e.elements[t];return this}toString(){let e="";for(let n=0;n<9;n++)e+=this.elements[n]+",";return e}reverse(e){e===void 0&&(e=new r);let t=3,n=6,i=d_,s,o;for(s=0;s<3;s++)for(o=0;o<3;o++)i[s+n*o]=this.elements[s+3*o];i[3]=1,i[9]=0,i[15]=0,i[4]=0,i[10]=1,i[16]=0,i[5]=0,i[11]=0,i[17]=1;let l=3,c=l,h,a=n,u;do{if(s=c-l,i[s+n*s]===0){for(o=s+1;o<c;o++)if(i[s+n*o]!==0){h=a;do u=a-h,i[u+n*s]+=i[u+n*o];while(--h);break}}if(i[s+n*s]!==0)for(o=s+1;o<c;o++){let d=i[s+n*o]/i[s+n*s];h=a;do u=a-h,i[u+n*o]=u<=s?0:i[u+n*o]-i[u+n*s]*d;while(--h)}}while(--l);s=2;do{o=s-1;do{let d=i[s+n*o]/i[s+n*s];h=n;do u=n-h,i[u+n*o]=i[u+n*o]-i[u+n*s]*d;while(--h)}while(o--)}while(--s);s=2;do{let d=1/i[s+n*s];h=n;do u=n-h,i[u+n*s]=i[u+n*s]*d;while(--h)}while(s--);s=2;do{o=2;do{if(u=i[t+o+n*s],isNaN(u)||u===1/0)throw`Could not reverse! A=[${this.toString()}]`;e.e(s,o,u)}while(o--)}while(s--);return e}setRotationFromQuaternion(e){let t=e.x,n=e.y,i=e.z,s=e.w,o=t+t,l=n+n,c=i+i,h=t*o,a=t*l,u=t*c,d=n*l,f=n*c,m=i*c,x=s*o,p=s*l,g=s*c,_=this.elements;return _[0]=1-(d+m),_[1]=a-g,_[2]=u+p,_[3]=a+g,_[4]=1-(h+m),_[5]=f-x,_[6]=u-p,_[7]=f+x,_[8]=1-(h+d),this}transpose(e){e===void 0&&(e=new r);let t=this.elements,n=e.elements,i;return n[0]=t[0],n[4]=t[4],n[8]=t[8],i=t[1],n[1]=t[3],n[3]=i,i=t[2],n[2]=t[6],n[6]=i,i=t[5],n[5]=t[7],n[7]=i,e}},d_=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],S=class r{constructor(e,t,n){e===void 0&&(e=0),t===void 0&&(t=0),n===void 0&&(n=0),this.x=e,this.y=t,this.z=n}cross(e,t){t===void 0&&(t=new r);let n=e.x,i=e.y,s=e.z,o=this.x,l=this.y,c=this.z;return t.x=l*s-c*i,t.y=c*n-o*s,t.z=o*i-l*n,t}set(e,t,n){return this.x=e,this.y=t,this.z=n,this}setZero(){this.x=this.y=this.z=0}vadd(e,t){if(t)t.x=e.x+this.x,t.y=e.y+this.y,t.z=e.z+this.z;else return new r(this.x+e.x,this.y+e.y,this.z+e.z)}vsub(e,t){if(t)t.x=this.x-e.x,t.y=this.y-e.y,t.z=this.z-e.z;else return new r(this.x-e.x,this.y-e.y,this.z-e.z)}crossmat(){return new _i([0,-this.z,this.y,this.z,0,-this.x,-this.y,this.x,0])}normalize(){let e=this.x,t=this.y,n=this.z,i=Math.sqrt(e*e+t*t+n*n);if(i>0){let s=1/i;this.x*=s,this.y*=s,this.z*=s}else this.x=0,this.y=0,this.z=0;return i}unit(e){e===void 0&&(e=new r);let t=this.x,n=this.y,i=this.z,s=Math.sqrt(t*t+n*n+i*i);return s>0?(s=1/s,e.x=t*s,e.y=n*s,e.z=i*s):(e.x=1,e.y=0,e.z=0),e}length(){let e=this.x,t=this.y,n=this.z;return Math.sqrt(e*e+t*t+n*n)}lengthSquared(){return this.dot(this)}distanceTo(e){let t=this.x,n=this.y,i=this.z,s=e.x,o=e.y,l=e.z;return Math.sqrt((s-t)*(s-t)+(o-n)*(o-n)+(l-i)*(l-i))}distanceSquared(e){let t=this.x,n=this.y,i=this.z,s=e.x,o=e.y,l=e.z;return(s-t)*(s-t)+(o-n)*(o-n)+(l-i)*(l-i)}scale(e,t){t===void 0&&(t=new r);let n=this.x,i=this.y,s=this.z;return t.x=e*n,t.y=e*i,t.z=e*s,t}vmul(e,t){return t===void 0&&(t=new r),t.x=e.x*this.x,t.y=e.y*this.y,t.z=e.z*this.z,t}addScaledVector(e,t,n){return n===void 0&&(n=new r),n.x=this.x+e*t.x,n.y=this.y+e*t.y,n.z=this.z+e*t.z,n}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}isZero(){return this.x===0&&this.y===0&&this.z===0}negate(e){return e===void 0&&(e=new r),e.x=-this.x,e.y=-this.y,e.z=-this.z,e}tangents(e,t){let n=this.length();if(n>0){let i=f_,s=1/n;i.set(this.x*s,this.y*s,this.z*s);let o=p_;Math.abs(i.x)<.9?(o.set(1,0,0),i.cross(o,e)):(o.set(0,1,0),i.cross(o,e)),i.cross(e,t)}else e.set(1,0,0),t.set(0,1,0)}toString(){return`${this.x},${this.y},${this.z}`}toArray(){return[this.x,this.y,this.z]}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}lerp(e,t,n){let i=this.x,s=this.y,o=this.z;n.x=i+(e.x-i)*t,n.y=s+(e.y-s)*t,n.z=o+(e.z-o)*t}almostEquals(e,t){return t===void 0&&(t=1e-6),!(Math.abs(this.x-e.x)>t||Math.abs(this.y-e.y)>t||Math.abs(this.z-e.z)>t)}almostZero(e){return e===void 0&&(e=1e-6),!(Math.abs(this.x)>e||Math.abs(this.y)>e||Math.abs(this.z)>e)}isAntiparallelTo(e,t){return this.negate(Pd),Pd.almostEquals(e,t)}clone(){return new r(this.x,this.y,this.z)}};S.ZERO=new S(0,0,0);S.UNIT_X=new S(1,0,0);S.UNIT_Y=new S(0,1,0);S.UNIT_Z=new S(0,0,1);var f_=new S,p_=new S,Pd=new S,nn=class r{constructor(e){e===void 0&&(e={}),this.lowerBound=new S,this.upperBound=new S,e.lowerBound&&this.lowerBound.copy(e.lowerBound),e.upperBound&&this.upperBound.copy(e.upperBound)}setFromPoints(e,t,n,i){let s=this.lowerBound,o=this.upperBound,l=n;s.copy(e[0]),l&&l.vmult(s,s),o.copy(s);for(let c=1;c<e.length;c++){let h=e[c];l&&(l.vmult(h,Ld),h=Ld),h.x>o.x&&(o.x=h.x),h.x<s.x&&(s.x=h.x),h.y>o.y&&(o.y=h.y),h.y<s.y&&(s.y=h.y),h.z>o.z&&(o.z=h.z),h.z<s.z&&(s.z=h.z)}return t&&(t.vadd(s,s),t.vadd(o,o)),i&&(s.x-=i,s.y-=i,s.z-=i,o.x+=i,o.y+=i,o.z+=i),this}copy(e){return this.lowerBound.copy(e.lowerBound),this.upperBound.copy(e.upperBound),this}clone(){return new r().copy(this)}extend(e){this.lowerBound.x=Math.min(this.lowerBound.x,e.lowerBound.x),this.upperBound.x=Math.max(this.upperBound.x,e.upperBound.x),this.lowerBound.y=Math.min(this.lowerBound.y,e.lowerBound.y),this.upperBound.y=Math.max(this.upperBound.y,e.upperBound.y),this.lowerBound.z=Math.min(this.lowerBound.z,e.lowerBound.z),this.upperBound.z=Math.max(this.upperBound.z,e.upperBound.z)}overlaps(e){let t=this.lowerBound,n=this.upperBound,i=e.lowerBound,s=e.upperBound,o=i.x<=n.x&&n.x<=s.x||t.x<=s.x&&s.x<=n.x,l=i.y<=n.y&&n.y<=s.y||t.y<=s.y&&s.y<=n.y,c=i.z<=n.z&&n.z<=s.z||t.z<=s.z&&s.z<=n.z;return o&&l&&c}volume(){let e=this.lowerBound,t=this.upperBound;return(t.x-e.x)*(t.y-e.y)*(t.z-e.z)}contains(e){let t=this.lowerBound,n=this.upperBound,i=e.lowerBound,s=e.upperBound;return t.x<=i.x&&n.x>=s.x&&t.y<=i.y&&n.y>=s.y&&t.z<=i.z&&n.z>=s.z}getCorners(e,t,n,i,s,o,l,c){let h=this.lowerBound,a=this.upperBound;e.copy(h),t.set(a.x,h.y,h.z),n.set(a.x,a.y,h.z),i.set(h.x,a.y,a.z),s.set(a.x,h.y,a.z),o.set(h.x,a.y,h.z),l.set(h.x,h.y,a.z),c.copy(a)}toLocalFrame(e,t){let n=Nd,i=n[0],s=n[1],o=n[2],l=n[3],c=n[4],h=n[5],a=n[6],u=n[7];this.getCorners(i,s,o,l,c,h,a,u);for(let d=0;d!==8;d++){let f=n[d];e.pointToLocal(f,f)}return t.setFromPoints(n)}toWorldFrame(e,t){let n=Nd,i=n[0],s=n[1],o=n[2],l=n[3],c=n[4],h=n[5],a=n[6],u=n[7];this.getCorners(i,s,o,l,c,h,a,u);for(let d=0;d!==8;d++){let f=n[d];e.pointToWorld(f,f)}return t.setFromPoints(n)}overlapsRay(e){let{direction:t,from:n}=e,i=1/t.x,s=1/t.y,o=1/t.z,l=(this.lowerBound.x-n.x)*i,c=(this.upperBound.x-n.x)*i,h=(this.lowerBound.y-n.y)*s,a=(this.upperBound.y-n.y)*s,u=(this.lowerBound.z-n.z)*o,d=(this.upperBound.z-n.z)*o,f=Math.max(Math.max(Math.min(l,c),Math.min(h,a)),Math.min(u,d)),m=Math.min(Math.min(Math.max(l,c),Math.max(h,a)),Math.max(u,d));return!(m<0||f>m)}},Ld=new S,Nd=[new S,new S,new S,new S,new S,new S,new S,new S],ja=class{constructor(){this.matrix=[]}get(e,t){let{index:n}=e,{index:i}=t;if(i>n){let s=i;i=n,n=s}return this.matrix[(n*(n+1)>>1)+i-1]}set(e,t,n){let{index:i}=e,{index:s}=t;if(s>i){let o=s;s=i,i=o}this.matrix[(i*(i+1)>>1)+s-1]=n?1:0}reset(){for(let e=0,t=this.matrix.length;e!==t;e++)this.matrix[e]=0}setNumObjects(e){this.matrix.length=e*(e-1)>>1}},Ka=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;return n[e]===void 0&&(n[e]=[]),n[e].includes(t)||n[e].push(t),this}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return!!(n[e]!==void 0&&n[e].includes(t))}hasAnyEventListener(e){return this._listeners===void 0?!1:this._listeners[e]!==void 0}removeEventListener(e,t){if(this._listeners===void 0)return this;let n=this._listeners;if(n[e]===void 0)return this;let i=n[e].indexOf(t);return i!==-1&&n[e].splice(i,1),this}dispatchEvent(e){if(this._listeners===void 0)return this;let n=this._listeners[e.type];if(n!==void 0){e.target=this;for(let i=0,s=n.length;i<s;i++)n[i].call(this,e)}return this}},Wt=class r{constructor(e,t,n,i){e===void 0&&(e=0),t===void 0&&(t=0),n===void 0&&(n=0),i===void 0&&(i=1),this.x=e,this.y=t,this.z=n,this.w=i}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}toString(){return`${this.x},${this.y},${this.z},${this.w}`}toArray(){return[this.x,this.y,this.z,this.w]}setFromAxisAngle(e,t){let n=Math.sin(t*.5);return this.x=e.x*n,this.y=e.y*n,this.z=e.z*n,this.w=Math.cos(t*.5),this}toAxisAngle(e){e===void 0&&(e=new S),this.normalize();let t=2*Math.acos(this.w),n=Math.sqrt(1-this.w*this.w);return n<.001?(e.x=this.x,e.y=this.y,e.z=this.z):(e.x=this.x/n,e.y=this.y/n,e.z=this.z/n),[e,t]}setFromVectors(e,t){if(e.isAntiparallelTo(t)){let n=m_,i=g_;e.tangents(n,i),this.setFromAxisAngle(n,Math.PI)}else{let n=e.cross(t);this.x=n.x,this.y=n.y,this.z=n.z,this.w=Math.sqrt(e.length()**2*t.length()**2)+e.dot(t),this.normalize()}return this}mult(e,t){t===void 0&&(t=new r);let n=this.x,i=this.y,s=this.z,o=this.w,l=e.x,c=e.y,h=e.z,a=e.w;return t.x=n*a+o*l+i*h-s*c,t.y=i*a+o*c+s*l-n*h,t.z=s*a+o*h+n*c-i*l,t.w=o*a-n*l-i*c-s*h,t}inverse(e){e===void 0&&(e=new r);let t=this.x,n=this.y,i=this.z,s=this.w;this.conjugate(e);let o=1/(t*t+n*n+i*i+s*s);return e.x*=o,e.y*=o,e.z*=o,e.w*=o,e}conjugate(e){return e===void 0&&(e=new r),e.x=-this.x,e.y=-this.y,e.z=-this.z,e.w=this.w,e}normalize(){let e=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);return e===0?(this.x=0,this.y=0,this.z=0,this.w=0):(e=1/e,this.x*=e,this.y*=e,this.z*=e,this.w*=e),this}normalizeFast(){let e=(3-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2;return e===0?(this.x=0,this.y=0,this.z=0,this.w=0):(this.x*=e,this.y*=e,this.z*=e,this.w*=e),this}vmult(e,t){t===void 0&&(t=new S);let n=e.x,i=e.y,s=e.z,o=this.x,l=this.y,c=this.z,h=this.w,a=h*n+l*s-c*i,u=h*i+c*n-o*s,d=h*s+o*i-l*n,f=-o*n-l*i-c*s;return t.x=a*h+f*-o+u*-c-d*-l,t.y=u*h+f*-l+d*-o-a*-c,t.z=d*h+f*-c+a*-l-u*-o,t}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w,this}toEuler(e,t){t===void 0&&(t="YZX");let n,i,s,o=this.x,l=this.y,c=this.z,h=this.w;switch(t){case"YZX":let a=o*l+c*h;if(a>.499&&(n=2*Math.atan2(o,h),i=Math.PI/2,s=0),a<-.499&&(n=-2*Math.atan2(o,h),i=-Math.PI/2,s=0),n===void 0){let u=o*o,d=l*l,f=c*c;n=Math.atan2(2*l*h-2*o*c,1-2*d-2*f),i=Math.asin(2*a),s=Math.atan2(2*o*h-2*l*c,1-2*u-2*f)}break;default:throw new Error(`Euler order ${t} not supported yet.`)}e.y=n,e.z=i,e.x=s}setFromEuler(e,t,n,i){i===void 0&&(i="XYZ");let s=Math.cos(e/2),o=Math.cos(t/2),l=Math.cos(n/2),c=Math.sin(e/2),h=Math.sin(t/2),a=Math.sin(n/2);return i==="XYZ"?(this.x=c*o*l+s*h*a,this.y=s*h*l-c*o*a,this.z=s*o*a+c*h*l,this.w=s*o*l-c*h*a):i==="YXZ"?(this.x=c*o*l+s*h*a,this.y=s*h*l-c*o*a,this.z=s*o*a-c*h*l,this.w=s*o*l+c*h*a):i==="ZXY"?(this.x=c*o*l-s*h*a,this.y=s*h*l+c*o*a,this.z=s*o*a+c*h*l,this.w=s*o*l-c*h*a):i==="ZYX"?(this.x=c*o*l-s*h*a,this.y=s*h*l+c*o*a,this.z=s*o*a-c*h*l,this.w=s*o*l+c*h*a):i==="YZX"?(this.x=c*o*l+s*h*a,this.y=s*h*l+c*o*a,this.z=s*o*a-c*h*l,this.w=s*o*l-c*h*a):i==="XZY"&&(this.x=c*o*l-s*h*a,this.y=s*h*l-c*o*a,this.z=s*o*a+c*h*l,this.w=s*o*l+c*h*a),this}clone(){return new r(this.x,this.y,this.z,this.w)}slerp(e,t,n){n===void 0&&(n=new r);let i=this.x,s=this.y,o=this.z,l=this.w,c=e.x,h=e.y,a=e.z,u=e.w,d,f,m,x,p;return f=i*c+s*h+o*a+l*u,f<0&&(f=-f,c=-c,h=-h,a=-a,u=-u),1-f>1e-6?(d=Math.acos(f),m=Math.sin(d),x=Math.sin((1-t)*d)/m,p=Math.sin(t*d)/m):(x=1-t,p=t),n.x=x*i+p*c,n.y=x*s+p*h,n.z=x*o+p*a,n.w=x*l+p*u,n}integrate(e,t,n,i){i===void 0&&(i=new r);let s=e.x*n.x,o=e.y*n.y,l=e.z*n.z,c=this.x,h=this.y,a=this.z,u=this.w,d=t*.5;return i.x+=d*(s*u+o*a-l*h),i.y+=d*(o*u+l*c-s*a),i.z+=d*(l*u+s*h-o*c),i.w+=d*(-s*c-o*h-l*a),i}},m_=new S,g_=new S,x_={SPHERE:1,PLANE:2,BOX:4,COMPOUND:8,CONVEXPOLYHEDRON:16,HEIGHTFIELD:32,PARTICLE:64,CYLINDER:128,TRIMESH:256},me=class r{constructor(e){e===void 0&&(e={}),this.id=r.idCounter++,this.type=e.type||0,this.boundingSphereRadius=0,this.collisionResponse=e.collisionResponse?e.collisionResponse:!0,this.collisionFilterGroup=e.collisionFilterGroup!==void 0?e.collisionFilterGroup:1,this.collisionFilterMask=e.collisionFilterMask!==void 0?e.collisionFilterMask:-1,this.material=e.material?e.material:null,this.body=null}updateBoundingSphereRadius(){throw`computeBoundingSphereRadius() not implemented for shape type ${this.type}`}volume(){throw`volume() not implemented for shape type ${this.type}`}calculateLocalInertia(e,t){throw`calculateLocalInertia() not implemented for shape type ${this.type}`}calculateWorldAABB(e,t,n,i){throw`calculateWorldAABB() not implemented for shape type ${this.type}`}};me.idCounter=0;me.types=x_;var Qe=class r{constructor(e){e===void 0&&(e={}),this.position=new S,this.quaternion=new Wt,e.position&&this.position.copy(e.position),e.quaternion&&this.quaternion.copy(e.quaternion)}pointToLocal(e,t){return r.pointToLocalFrame(this.position,this.quaternion,e,t)}pointToWorld(e,t){return r.pointToWorldFrame(this.position,this.quaternion,e,t)}vectorToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t}static pointToLocalFrame(e,t,n,i){return i===void 0&&(i=new S),n.vsub(e,i),t.conjugate(Dd),Dd.vmult(i,i),i}static pointToWorldFrame(e,t,n,i){return i===void 0&&(i=new S),t.vmult(n,i),i.vadd(e,i),i}static vectorToWorldFrame(e,t,n){return n===void 0&&(n=new S),e.vmult(t,n),n}static vectorToLocalFrame(e,t,n,i){return i===void 0&&(i=new S),t.w*=-1,t.vmult(n,i),t.w*=-1,i}},Dd=new Wt,$c=class r extends me{constructor(e){e===void 0&&(e={});let{vertices:t=[],faces:n=[],normals:i=[],axes:s,boundingSphereRadius:o}=e;super({type:me.types.CONVEXPOLYHEDRON}),this.vertices=t,this.faces=n,this.faceNormals=i,this.faceNormals.length===0&&this.computeNormals(),o?this.boundingSphereRadius=o:this.updateBoundingSphereRadius(),this.worldVertices=[],this.worldVerticesNeedsUpdate=!0,this.worldFaceNormals=[],this.worldFaceNormalsNeedsUpdate=!0,this.uniqueAxes=s?s.slice():null,this.uniqueEdges=[],this.computeEdges()}computeEdges(){let e=this.faces,t=this.vertices,n=this.uniqueEdges;n.length=0;let i=new S;for(let s=0;s!==e.length;s++){let o=e[s],l=o.length;for(let c=0;c!==l;c++){let h=(c+1)%l;t[o[c]].vsub(t[o[h]],i),i.normalize();let a=!1;for(let u=0;u!==n.length;u++)if(n[u].almostEquals(i)||n[u].almostEquals(i)){a=!0;break}a||n.push(i.clone())}}}computeNormals(){this.faceNormals.length=this.faces.length;for(let e=0;e<this.faces.length;e++){for(let i=0;i<this.faces[e].length;i++)if(!this.vertices[this.faces[e][i]])throw new Error(`Vertex ${this.faces[e][i]} not found!`);let t=this.faceNormals[e]||new S;this.getFaceNormal(e,t),t.negate(t),this.faceNormals[e]=t;let n=this.vertices[this.faces[e][0]];if(t.dot(n)<0){console.error(`.faceNormals[${e}] = Vec3(${t.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);for(let i=0;i<this.faces[e].length;i++)console.warn(`.vertices[${this.faces[e][i]}] = Vec3(${this.vertices[this.faces[e][i]].toString()})`)}}}getFaceNormal(e,t){let n=this.faces[e],i=this.vertices[n[0]],s=this.vertices[n[1]],o=this.vertices[n[2]];r.computeNormal(i,s,o,t)}static computeNormal(e,t,n,i){let s=new S,o=new S;t.vsub(e,o),n.vsub(t,s),s.cross(o,i),i.isZero()||i.normalize()}clipAgainstHull(e,t,n,i,s,o,l,c,h){let a=new S,u=-1,d=-Number.MAX_VALUE;for(let m=0;m<n.faces.length;m++){a.copy(n.faceNormals[m]),s.vmult(a,a);let x=a.dot(o);x>d&&(d=x,u=m)}let f=[];for(let m=0;m<n.faces[u].length;m++){let x=n.vertices[n.faces[u][m]],p=new S;p.copy(x),s.vmult(p,p),i.vadd(p,p),f.push(p)}u>=0&&this.clipFaceAgainstHull(o,e,t,f,l,c,h)}findSeparatingAxis(e,t,n,i,s,o,l,c){let h=new S,a=new S,u=new S,d=new S,f=new S,m=new S,x=Number.MAX_VALUE,p=this;if(p.uniqueAxes)for(let g=0;g!==p.uniqueAxes.length;g++){n.vmult(p.uniqueAxes[g],h);let _=p.testSepAxis(h,e,t,n,i,s);if(_===!1)return!1;_<x&&(x=_,o.copy(h))}else{let g=l?l.length:p.faces.length;for(let _=0;_<g;_++){let y=l?l[_]:_;h.copy(p.faceNormals[y]),n.vmult(h,h);let v=p.testSepAxis(h,e,t,n,i,s);if(v===!1)return!1;v<x&&(x=v,o.copy(h))}}if(e.uniqueAxes)for(let g=0;g!==e.uniqueAxes.length;g++){s.vmult(e.uniqueAxes[g],a);let _=p.testSepAxis(a,e,t,n,i,s);if(_===!1)return!1;_<x&&(x=_,o.copy(a))}else{let g=c?c.length:e.faces.length;for(let _=0;_<g;_++){let y=c?c[_]:_;a.copy(e.faceNormals[y]),s.vmult(a,a);let v=p.testSepAxis(a,e,t,n,i,s);if(v===!1)return!1;v<x&&(x=v,o.copy(a))}}for(let g=0;g!==p.uniqueEdges.length;g++){n.vmult(p.uniqueEdges[g],d);for(let _=0;_!==e.uniqueEdges.length;_++)if(s.vmult(e.uniqueEdges[_],f),d.cross(f,m),!m.almostZero()){m.normalize();let y=p.testSepAxis(m,e,t,n,i,s);if(y===!1)return!1;y<x&&(x=y,o.copy(m))}}return i.vsub(t,u),u.dot(o)>0&&o.negate(o),!0}testSepAxis(e,t,n,i,s,o){let l=this;r.project(l,e,n,i,Hc),r.project(t,e,s,o,Gc);let c=Hc[0],h=Hc[1],a=Gc[0],u=Gc[1];if(c<u||a<h)return!1;let d=c-u,f=a-h;return d<f?d:f}calculateLocalInertia(e,t){let n=new S,i=new S;this.computeLocalAABB(i,n);let s=n.x-i.x,o=n.y-i.y,l=n.z-i.z;t.x=1/12*e*(2*o*2*o+2*l*2*l),t.y=1/12*e*(2*s*2*s+2*l*2*l),t.z=1/12*e*(2*o*2*o+2*s*2*s)}getPlaneConstantOfFace(e){let t=this.faces[e],n=this.faceNormals[e],i=this.vertices[t[0]];return-n.dot(i)}clipFaceAgainstHull(e,t,n,i,s,o,l){let c=new S,h=new S,a=new S,u=new S,d=new S,f=new S,m=new S,x=new S,p=this,g=[],_=i,y=g,v=-1,T=Number.MAX_VALUE;for(let b=0;b<p.faces.length;b++){c.copy(p.faceNormals[b]),n.vmult(c,c);let P=c.dot(e);P<T&&(T=P,v=b)}if(v<0)return;let A=p.faces[v];A.connectedFaces=[];for(let b=0;b<p.faces.length;b++)for(let P=0;P<p.faces[b].length;P++)A.indexOf(p.faces[b][P])!==-1&&b!==v&&A.connectedFaces.indexOf(b)===-1&&A.connectedFaces.push(b);let C=A.length;for(let b=0;b<C;b++){let P=p.vertices[A[b]],B=p.vertices[A[(b+1)%C]];P.vsub(B,h),a.copy(h),n.vmult(a,a),t.vadd(a,a),u.copy(this.faceNormals[v]),n.vmult(u,u),t.vadd(u,u),a.cross(u,d),d.negate(d),f.copy(P),n.vmult(f,f),t.vadd(f,f);let L=A.connectedFaces[b];m.copy(this.faceNormals[L]);let U=this.getPlaneConstantOfFace(L);x.copy(m),n.vmult(x,x);let O=U-x.dot(t);for(this.clipFaceAgainstPlane(_,y,x,O);_.length;)_.shift();for(;y.length;)_.push(y.shift())}m.copy(this.faceNormals[v]);let R=this.getPlaneConstantOfFace(v);x.copy(m),n.vmult(x,x);let M=R-x.dot(t);for(let b=0;b<_.length;b++){let P=x.dot(_[b])+M;if(P<=s&&(console.log(`clamped: depth=${P} to minDist=${s}`),P=s),P<=o){let B=_[b];if(P<=1e-6){let L={point:B,normal:x,depth:P};l.push(L)}}}}clipFaceAgainstPlane(e,t,n,i){let s,o,l=e.length;if(l<2)return t;let c=e[e.length-1],h=e[0];s=n.dot(c)+i;for(let a=0;a<l;a++){if(h=e[a],o=n.dot(h)+i,s<0)if(o<0){let u=new S;u.copy(h),t.push(u)}else{let u=new S;c.lerp(h,s/(s-o),u),t.push(u)}else if(o<0){let u=new S;c.lerp(h,s/(s-o),u),t.push(u),t.push(h)}c=h,s=o}return t}computeWorldVertices(e,t){for(;this.worldVertices.length<this.vertices.length;)this.worldVertices.push(new S);let n=this.vertices,i=this.worldVertices;for(let s=0;s!==this.vertices.length;s++)t.vmult(n[s],i[s]),e.vadd(i[s],i[s]);this.worldVerticesNeedsUpdate=!1}computeLocalAABB(e,t){let n=this.vertices;e.set(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),t.set(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);for(let i=0;i<this.vertices.length;i++){let s=n[i];s.x<e.x?e.x=s.x:s.x>t.x&&(t.x=s.x),s.y<e.y?e.y=s.y:s.y>t.y&&(t.y=s.y),s.z<e.z?e.z=s.z:s.z>t.z&&(t.z=s.z)}}computeWorldFaceNormals(e){let t=this.faceNormals.length;for(;this.worldFaceNormals.length<t;)this.worldFaceNormals.push(new S);let n=this.faceNormals,i=this.worldFaceNormals;for(let s=0;s!==t;s++)e.vmult(n[s],i[s]);this.worldFaceNormalsNeedsUpdate=!1}updateBoundingSphereRadius(){let e=0,t=this.vertices;for(let n=0;n!==t.length;n++){let i=t[n].lengthSquared();i>e&&(e=i)}this.boundingSphereRadius=Math.sqrt(e)}calculateWorldAABB(e,t,n,i){let s=this.vertices,o,l,c,h,a,u,d=new S;for(let f=0;f<s.length;f++){d.copy(s[f]),t.vmult(d,d),e.vadd(d,d);let m=d;(o===void 0||m.x<o)&&(o=m.x),(h===void 0||m.x>h)&&(h=m.x),(l===void 0||m.y<l)&&(l=m.y),(a===void 0||m.y>a)&&(a=m.y),(c===void 0||m.z<c)&&(c=m.z),(u===void 0||m.z>u)&&(u=m.z)}n.set(o,l,c),i.set(h,a,u)}volume(){return 4*Math.PI*this.boundingSphereRadius/3}getAveragePointLocal(e){e===void 0&&(e=new S);let t=this.vertices;for(let n=0;n<t.length;n++)e.vadd(t[n],e);return e.scale(1/t.length,e),e}transformAllPoints(e,t){let n=this.vertices.length,i=this.vertices;if(t){for(let s=0;s<n;s++){let o=i[s];t.vmult(o,o)}for(let s=0;s<this.faceNormals.length;s++){let o=this.faceNormals[s];t.vmult(o,o)}}if(e)for(let s=0;s<n;s++){let o=i[s];o.vadd(e,o)}}pointIsInside(e){let t=this.vertices,n=this.faces,i=this.faceNormals,s=null,o=new S;this.getAveragePointLocal(o);for(let l=0;l<this.faces.length;l++){let c=i[l],h=t[n[l][0]],a=new S;e.vsub(h,a);let u=c.dot(a),d=new S;o.vsub(h,d);let f=c.dot(d);if(u<0&&f>0||u>0&&f<0)return!1}return s?1:-1}static project(e,t,n,i,s){let o=e.vertices.length,l=v_,c=0,h=0,a=y_,u=e.vertices;a.setZero(),Qe.vectorToLocalFrame(n,i,t,l),Qe.pointToLocalFrame(n,i,a,a);let d=a.dot(l);h=c=u[0].dot(l);for(let f=1;f<o;f++){let m=u[f].dot(l);m>c&&(c=m),m<h&&(h=m)}if(h-=d,c-=d,h>c){let f=h;h=c,c=f}s[0]=c,s[1]=h}},Hc=[],Gc=[],__=new S,v_=new S,y_=new S,Nr=class r extends me{constructor(e){super({type:me.types.BOX}),this.halfExtents=e,this.convexPolyhedronRepresentation=null,this.updateConvexPolyhedronRepresentation(),this.updateBoundingSphereRadius()}updateConvexPolyhedronRepresentation(){let e=this.halfExtents.x,t=this.halfExtents.y,n=this.halfExtents.z,i=S,s=[new i(-e,-t,-n),new i(e,-t,-n),new i(e,t,-n),new i(-e,t,-n),new i(-e,-t,n),new i(e,-t,n),new i(e,t,n),new i(-e,t,n)],o=[[3,2,1,0],[4,5,6,7],[5,4,0,1],[2,3,7,6],[0,4,7,3],[1,2,6,5]],l=[new i(0,0,1),new i(0,1,0),new i(1,0,0)],c=new $c({vertices:s,faces:o,axes:l});this.convexPolyhedronRepresentation=c,c.material=this.material}calculateLocalInertia(e,t){return t===void 0&&(t=new S),r.calculateInertia(this.halfExtents,e,t),t}static calculateInertia(e,t,n){let i=e;n.x=1/12*t*(2*i.y*2*i.y+2*i.z*2*i.z),n.y=1/12*t*(2*i.x*2*i.x+2*i.z*2*i.z),n.z=1/12*t*(2*i.y*2*i.y+2*i.x*2*i.x)}getSideNormals(e,t){let n=e,i=this.halfExtents;if(n[0].set(i.x,0,0),n[1].set(0,i.y,0),n[2].set(0,0,i.z),n[3].set(-i.x,0,0),n[4].set(0,-i.y,0),n[5].set(0,0,-i.z),t!==void 0)for(let s=0;s!==n.length;s++)t.vmult(n[s],n[s]);return n}volume(){return 8*this.halfExtents.x*this.halfExtents.y*this.halfExtents.z}updateBoundingSphereRadius(){this.boundingSphereRadius=this.halfExtents.length()}forEachWorldCorner(e,t,n){let i=this.halfExtents,s=[[i.x,i.y,i.z],[-i.x,i.y,i.z],[-i.x,-i.y,i.z],[-i.x,-i.y,-i.z],[i.x,-i.y,-i.z],[i.x,i.y,-i.z],[-i.x,i.y,-i.z],[i.x,-i.y,i.z]];for(let o=0;o<s.length;o++)xi.set(s[o][0],s[o][1],s[o][2]),t.vmult(xi,xi),e.vadd(xi,xi),n(xi.x,xi.y,xi.z)}calculateWorldAABB(e,t,n,i){let s=this.halfExtents;Nn[0].set(s.x,s.y,s.z),Nn[1].set(-s.x,s.y,s.z),Nn[2].set(-s.x,-s.y,s.z),Nn[3].set(-s.x,-s.y,-s.z),Nn[4].set(s.x,-s.y,-s.z),Nn[5].set(s.x,s.y,-s.z),Nn[6].set(-s.x,s.y,-s.z),Nn[7].set(s.x,-s.y,s.z);let o=Nn[0];t.vmult(o,o),e.vadd(o,o),i.copy(o),n.copy(o);for(let l=1;l<8;l++){let c=Nn[l];t.vmult(c,c),e.vadd(c,c);let h=c.x,a=c.y,u=c.z;h>i.x&&(i.x=h),a>i.y&&(i.y=a),u>i.z&&(i.z=u),h<n.x&&(n.x=h),a<n.y&&(n.y=a),u<n.z&&(n.z=u)}}},xi=new S,Nn=[new S,new S,new S,new S,new S,new S,new S,new S],sh={DYNAMIC:1,STATIC:2,KINEMATIC:4},rh={AWAKE:0,SLEEPY:1,SLEEPING:2},He=class r extends Ka{constructor(e){e===void 0&&(e={}),super(),this.id=r.idCounter++,this.index=-1,this.world=null,this.vlambda=new S,this.collisionFilterGroup=typeof e.collisionFilterGroup=="number"?e.collisionFilterGroup:1,this.collisionFilterMask=typeof e.collisionFilterMask=="number"?e.collisionFilterMask:-1,this.collisionResponse=typeof e.collisionResponse=="boolean"?e.collisionResponse:!0,this.position=new S,this.previousPosition=new S,this.interpolatedPosition=new S,this.initPosition=new S,e.position&&(this.position.copy(e.position),this.previousPosition.copy(e.position),this.interpolatedPosition.copy(e.position),this.initPosition.copy(e.position)),this.velocity=new S,e.velocity&&this.velocity.copy(e.velocity),this.initVelocity=new S,this.force=new S;let t=typeof e.mass=="number"?e.mass:0;this.mass=t,this.invMass=t>0?1/t:0,this.material=e.material||null,this.linearDamping=typeof e.linearDamping=="number"?e.linearDamping:.01,this.type=t<=0?r.STATIC:r.DYNAMIC,typeof e.type==typeof r.STATIC&&(this.type=e.type),this.allowSleep=typeof e.allowSleep<"u"?e.allowSleep:!0,this.sleepState=r.AWAKE,this.sleepSpeedLimit=typeof e.sleepSpeedLimit<"u"?e.sleepSpeedLimit:.1,this.sleepTimeLimit=typeof e.sleepTimeLimit<"u"?e.sleepTimeLimit:1,this.timeLastSleepy=0,this.wakeUpAfterNarrowphase=!1,this.torque=new S,this.quaternion=new Wt,this.initQuaternion=new Wt,this.previousQuaternion=new Wt,this.interpolatedQuaternion=new Wt,e.quaternion&&(this.quaternion.copy(e.quaternion),this.initQuaternion.copy(e.quaternion),this.previousQuaternion.copy(e.quaternion),this.interpolatedQuaternion.copy(e.quaternion)),this.angularVelocity=new S,e.angularVelocity&&this.angularVelocity.copy(e.angularVelocity),this.initAngularVelocity=new S,this.shapes=[],this.shapeOffsets=[],this.shapeOrientations=[],this.inertia=new S,this.invInertia=new S,this.invInertiaWorld=new _i,this.invMassSolve=0,this.invInertiaSolve=new S,this.invInertiaWorldSolve=new _i,this.fixedRotation=typeof e.fixedRotation<"u"?e.fixedRotation:!1,this.angularDamping=typeof e.angularDamping<"u"?e.angularDamping:.01,this.linearFactor=new S(1,1,1),e.linearFactor&&this.linearFactor.copy(e.linearFactor),this.angularFactor=new S(1,1,1),e.angularFactor&&this.angularFactor.copy(e.angularFactor),this.aabb=new nn,this.aabbNeedsUpdate=!0,this.boundingRadius=0,this.wlambda=new S,this.isTrigger=!!e.isTrigger,e.shape&&this.addShape(e.shape),this.updateMassProperties()}wakeUp(){let e=this.sleepState;this.sleepState=r.AWAKE,this.wakeUpAfterNarrowphase=!1,e===r.SLEEPING&&this.dispatchEvent(r.wakeupEvent)}sleep(){this.sleepState=r.SLEEPING,this.velocity.set(0,0,0),this.angularVelocity.set(0,0,0),this.wakeUpAfterNarrowphase=!1}sleepTick(e){if(this.allowSleep){let t=this.sleepState,n=this.velocity.lengthSquared()+this.angularVelocity.lengthSquared(),i=this.sleepSpeedLimit**2;t===r.AWAKE&&n<i?(this.sleepState=r.SLEEPY,this.timeLastSleepy=e,this.dispatchEvent(r.sleepyEvent)):t===r.SLEEPY&&n>i?this.wakeUp():t===r.SLEEPY&&e-this.timeLastSleepy>this.sleepTimeLimit&&(this.sleep(),this.dispatchEvent(r.sleepEvent))}}updateSolveMassProperties(){this.sleepState===r.SLEEPING||this.type===r.KINEMATIC?(this.invMassSolve=0,this.invInertiaSolve.setZero(),this.invInertiaWorldSolve.setZero()):(this.invMassSolve=this.invMass,this.invInertiaSolve.copy(this.invInertia),this.invInertiaWorldSolve.copy(this.invInertiaWorld))}pointToLocalFrame(e,t){return t===void 0&&(t=new S),e.vsub(this.position,t),this.quaternion.conjugate().vmult(t,t),t}vectorToLocalFrame(e,t){return t===void 0&&(t=new S),this.quaternion.conjugate().vmult(e,t),t}pointToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t.vadd(this.position,t),t}vectorToWorldFrame(e,t){return t===void 0&&(t=new S),this.quaternion.vmult(e,t),t}addShape(e,t,n){let i=new S,s=new Wt;return t&&i.copy(t),n&&s.copy(n),this.shapes.push(e),this.shapeOffsets.push(i),this.shapeOrientations.push(s),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,e.body=this,this}removeShape(e){let t=this.shapes.indexOf(e);return t===-1?(console.warn("Shape does not belong to the body"),this):(this.shapes.splice(t,1),this.shapeOffsets.splice(t,1),this.shapeOrientations.splice(t,1),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,e.body=null,this)}updateBoundingRadius(){let e=this.shapes,t=this.shapeOffsets,n=e.length,i=0;for(let s=0;s!==n;s++){let o=e[s];o.updateBoundingSphereRadius();let l=t[s].length(),c=o.boundingSphereRadius;l+c>i&&(i=l+c)}this.boundingRadius=i}updateAABB(){let e=this.shapes,t=this.shapeOffsets,n=this.shapeOrientations,i=e.length,s=b_,o=w_,l=this.quaternion,c=this.aabb,h=M_;for(let a=0;a!==i;a++){let u=e[a];l.vmult(t[a],s),s.vadd(this.position,s),l.mult(n[a],o),u.calculateWorldAABB(s,o,h.lowerBound,h.upperBound),a===0?c.copy(h):c.extend(h)}this.aabbNeedsUpdate=!1}updateInertiaWorld(e){let t=this.invInertia;if(!(t.x===t.y&&t.y===t.z&&!e)){let n=S_,i=A_;n.setRotationFromQuaternion(this.quaternion),n.transpose(i),n.scale(t,n),n.mmult(i,this.invInertiaWorld)}}applyForce(e,t){if(t===void 0&&(t=new S),this.type!==r.DYNAMIC)return;this.sleepState===r.SLEEPING&&this.wakeUp();let n=E_;t.cross(e,n),this.force.vadd(e,this.force),this.torque.vadd(n,this.torque)}applyLocalForce(e,t){if(t===void 0&&(t=new S),this.type!==r.DYNAMIC)return;let n=C_,i=R_;this.vectorToWorldFrame(e,n),this.vectorToWorldFrame(t,i),this.applyForce(n,i)}applyTorque(e){this.type===r.DYNAMIC&&(this.sleepState===r.SLEEPING&&this.wakeUp(),this.torque.vadd(e,this.torque))}applyImpulse(e,t){if(t===void 0&&(t=new S),this.type!==r.DYNAMIC)return;this.sleepState===r.SLEEPING&&this.wakeUp();let n=t,i=I_;i.copy(e),i.scale(this.invMass,i),this.velocity.vadd(i,this.velocity);let s=P_;n.cross(e,s),this.invInertiaWorld.vmult(s,s),this.angularVelocity.vadd(s,this.angularVelocity)}applyLocalImpulse(e,t){if(t===void 0&&(t=new S),this.type!==r.DYNAMIC)return;let n=L_,i=N_;this.vectorToWorldFrame(e,n),this.vectorToWorldFrame(t,i),this.applyImpulse(n,i)}updateMassProperties(){let e=D_;this.invMass=this.mass>0?1/this.mass:0;let t=this.inertia,n=this.fixedRotation;this.updateAABB(),e.set((this.aabb.upperBound.x-this.aabb.lowerBound.x)/2,(this.aabb.upperBound.y-this.aabb.lowerBound.y)/2,(this.aabb.upperBound.z-this.aabb.lowerBound.z)/2),Nr.calculateInertia(e,this.mass,t),this.invInertia.set(t.x>0&&!n?1/t.x:0,t.y>0&&!n?1/t.y:0,t.z>0&&!n?1/t.z:0),this.updateInertiaWorld(!0)}getVelocityAtWorldPoint(e,t){let n=new S;return e.vsub(this.position,n),this.angularVelocity.cross(n,t),this.velocity.vadd(t,t),t}integrate(e,t,n){if(this.previousPosition.copy(this.position),this.previousQuaternion.copy(this.quaternion),!(this.type===r.DYNAMIC||this.type===r.KINEMATIC)||this.sleepState===r.SLEEPING)return;let i=this.velocity,s=this.angularVelocity,o=this.position,l=this.force,c=this.torque,h=this.quaternion,a=this.invMass,u=this.invInertiaWorld,d=this.linearFactor,f=a*e;i.x+=l.x*f*d.x,i.y+=l.y*f*d.y,i.z+=l.z*f*d.z;let m=u.elements,x=this.angularFactor,p=c.x*x.x,g=c.y*x.y,_=c.z*x.z;s.x+=e*(m[0]*p+m[1]*g+m[2]*_),s.y+=e*(m[3]*p+m[4]*g+m[5]*_),s.z+=e*(m[6]*p+m[7]*g+m[8]*_),o.x+=i.x*e,o.y+=i.y*e,o.z+=i.z*e,h.integrate(this.angularVelocity,e,this.angularFactor,h),t&&(n?h.normalizeFast():h.normalize()),this.aabbNeedsUpdate=!0,this.updateInertiaWorld()}};He.idCounter=0;He.COLLIDE_EVENT_NAME="collide";He.DYNAMIC=sh.DYNAMIC;He.STATIC=sh.STATIC;He.KINEMATIC=sh.KINEMATIC;He.AWAKE=rh.AWAKE;He.SLEEPY=rh.SLEEPY;He.SLEEPING=rh.SLEEPING;He.wakeupEvent={type:"wakeup"};He.sleepyEvent={type:"sleepy"};He.sleepEvent={type:"sleep"};var b_=new S,w_=new Wt,M_=new nn,S_=new _i,A_=new _i,T_=new _i,E_=new S,C_=new S,R_=new S,I_=new S,P_=new S,L_=new S,N_=new S,D_=new S,Ja=class{constructor(){this.world=null,this.useBoundingBoxes=!1,this.dirty=!0}collisionPairs(e,t,n){throw new Error("collisionPairs not implemented for this BroadPhase class!")}needBroadphaseCollision(e,t){return!((e.collisionFilterGroup&t.collisionFilterMask)===0||(t.collisionFilterGroup&e.collisionFilterMask)===0||((e.type&He.STATIC)!==0||e.sleepState===He.SLEEPING)&&((t.type&He.STATIC)!==0||t.sleepState===He.SLEEPING))}intersectionTest(e,t,n,i){this.useBoundingBoxes?this.doBoundingBoxBroadphase(e,t,n,i):this.doBoundingSphereBroadphase(e,t,n,i)}doBoundingSphereBroadphase(e,t,n,i){let s=F_;t.position.vsub(e.position,s);let o=(e.boundingRadius+t.boundingRadius)**2;s.lengthSquared()<o&&(n.push(e),i.push(t))}doBoundingBoxBroadphase(e,t,n,i){e.aabbNeedsUpdate&&e.updateAABB(),t.aabbNeedsUpdate&&t.updateAABB(),e.aabb.overlaps(t.aabb)&&(n.push(e),i.push(t))}makePairsUnique(e,t){let n=B_,i=U_,s=z_,o=e.length;for(let l=0;l!==o;l++)i[l]=e[l],s[l]=t[l];e.length=0,t.length=0;for(let l=0;l!==o;l++){let c=i[l].id,h=s[l].id,a=c<h?`${c},${h}`:`${h},${c}`;n[a]=l,n.keys.push(a)}for(let l=0;l!==n.keys.length;l++){let c=n.keys.pop(),h=n[c];e.push(i[h]),t.push(s[h]),delete n[c]}}setWorld(e){}static boundingSphereCheck(e,t){let n=new S;e.position.vsub(t.position,n);let i=e.shapes[0],s=t.shapes[0];return Math.pow(i.boundingSphereRadius+s.boundingSphereRadius,2)>n.lengthSquared()}aabbQuery(e,t,n){return console.warn(".aabbQuery is not implemented in this Broadphase subclass."),[]}},F_=new S;new S;new Wt;new S;var B_={keys:[]},U_=[],z_=[];new S;var JM=new S;new S;var Zc=class extends Ja{constructor(){super()}collisionPairs(e,t,n){let i=e.bodies,s=i.length,o,l;for(let c=0;c!==s;c++)for(let h=0;h!==c;h++)o=i[c],l=i[h],this.needBroadphaseCollision(o,l)&&this.intersectionTest(o,l,t,n)}aabbQuery(e,t,n){n===void 0&&(n=[]);for(let i=0;i<e.bodies.length;i++){let s=e.bodies[i];s.aabbNeedsUpdate&&s.updateAABB(),s.aabb.overlaps(t)&&n.push(s)}return n}},vi=class{constructor(){this.rayFromWorld=new S,this.rayToWorld=new S,this.hitNormalWorld=new S,this.hitPointWorld=new S,this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}reset(){this.rayFromWorld.setZero(),this.rayToWorld.setZero(),this.hitNormalWorld.setZero(),this.hitPointWorld.setZero(),this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}abort(){this.shouldStop=!0}set(e,t,n,i,s,o,l){this.rayFromWorld.copy(e),this.rayToWorld.copy(t),this.hitNormalWorld.copy(n),this.hitPointWorld.copy(i),this.shape=s,this.body=o,this.distance=l}},Xd,Yd,$d,Zd,jd,Kd,Jd,oh={CLOSEST:1,ANY:2,ALL:4};Xd=me.types.SPHERE;Yd=me.types.PLANE;$d=me.types.BOX;Zd=me.types.CYLINDER;jd=me.types.CONVEXPOLYHEDRON;Kd=me.types.HEIGHTFIELD;Jd=me.types.TRIMESH;var dn=class r{get[Xd](){return this._intersectSphere}get[Yd](){return this._intersectPlane}get[$d](){return this._intersectBox}get[Zd](){return this._intersectConvex}get[jd](){return this._intersectConvex}get[Kd](){return this._intersectHeightfield}get[Jd](){return this._intersectTrimesh}constructor(e,t){e===void 0&&(e=new S),t===void 0&&(t=new S),this.from=e.clone(),this.to=t.clone(),this.direction=new S,this.precision=1e-4,this.checkCollisionResponse=!0,this.skipBackfaces=!1,this.collisionFilterMask=-1,this.collisionFilterGroup=-1,this.mode=r.ANY,this.result=new vi,this.hasHit=!1,this.callback=n=>{}}intersectWorld(e,t){return this.mode=t.mode||r.ANY,this.result=t.result||new vi,this.skipBackfaces=!!t.skipBackfaces,this.collisionFilterMask=typeof t.collisionFilterMask<"u"?t.collisionFilterMask:-1,this.collisionFilterGroup=typeof t.collisionFilterGroup<"u"?t.collisionFilterGroup:-1,this.checkCollisionResponse=typeof t.checkCollisionResponse<"u"?t.checkCollisionResponse:!0,t.from&&this.from.copy(t.from),t.to&&this.to.copy(t.to),this.callback=t.callback||(()=>{}),this.hasHit=!1,this.result.reset(),this.updateDirection(),this.getAABB(Fd),Wc.length=0,e.broadphase.aabbQuery(e,Fd,Wc),this.intersectBodies(Wc),this.hasHit}intersectBody(e,t){t&&(this.result=t,this.updateDirection());let n=this.checkCollisionResponse;if(n&&!e.collisionResponse||(this.collisionFilterGroup&e.collisionFilterMask)===0||(e.collisionFilterGroup&this.collisionFilterMask)===0)return;let i=O_,s=k_;for(let o=0,l=e.shapes.length;o<l;o++){let c=e.shapes[o];if(!(n&&!c.collisionResponse)&&(e.quaternion.mult(e.shapeOrientations[o],s),e.quaternion.vmult(e.shapeOffsets[o],i),i.vadd(e.position,i),this.intersectShape(c,s,i,e),this.result.shouldStop))break}}intersectBodies(e,t){t&&(this.result=t,this.updateDirection());for(let n=0,i=e.length;!this.result.shouldStop&&n<i;n++)this.intersectBody(e[n])}updateDirection(){this.to.vsub(this.from,this.direction),this.direction.normalize()}intersectShape(e,t,n,i){let s=this.from;if(nv(s,this.direction,n)>e.boundingSphereRadius)return;let l=this[e.type];l&&l.call(this,e,t,n,i,e)}_intersectBox(e,t,n,i,s){return this._intersectConvex(e.convexPolyhedronRepresentation,t,n,i,s)}_intersectPlane(e,t,n,i,s){let o=this.from,l=this.to,c=this.direction,h=new S(0,0,1);t.vmult(h,h);let a=new S;o.vsub(n,a);let u=a.dot(h);l.vsub(n,a);let d=a.dot(h);if(u*d>0||o.distanceTo(l)<u)return;let f=h.dot(c);if(Math.abs(f)<this.precision)return;let m=new S,x=new S,p=new S;o.vsub(n,m);let g=-h.dot(m)/f;c.scale(g,x),o.vadd(x,p),this.reportIntersection(h,p,s,i,-1)}getAABB(e){let{lowerBound:t,upperBound:n}=e,i=this.to,s=this.from;t.x=Math.min(i.x,s.x),t.y=Math.min(i.y,s.y),t.z=Math.min(i.z,s.z),n.x=Math.max(i.x,s.x),n.y=Math.max(i.y,s.y),n.z=Math.max(i.z,s.z)}_intersectHeightfield(e,t,n,i,s){e.data,e.elementSize;let o=V_;o.from.copy(this.from),o.to.copy(this.to),Qe.pointToLocalFrame(n,t,o.from,o.from),Qe.pointToLocalFrame(n,t,o.to,o.to),o.updateDirection();let l=H_,c,h,a,u;c=h=0,a=u=e.data.length-1;let d=new nn;o.getAABB(d),e.getIndexOfPosition(d.lowerBound.x,d.lowerBound.y,l,!0),c=Math.max(c,l[0]),h=Math.max(h,l[1]),e.getIndexOfPosition(d.upperBound.x,d.upperBound.y,l,!0),a=Math.min(a,l[0]+1),u=Math.min(u,l[1]+1);for(let f=c;f<a;f++)for(let m=h;m<u;m++){if(this.result.shouldStop)return;if(e.getAabbAtIndex(f,m,d),!!d.overlapsRay(o)){if(e.getConvexTrianglePillar(f,m,!1),Qe.pointToWorldFrame(n,t,e.pillarOffset,qa),this._intersectConvex(e.pillarConvex,t,qa,i,s,Bd),this.result.shouldStop)return;e.getConvexTrianglePillar(f,m,!0),Qe.pointToWorldFrame(n,t,e.pillarOffset,qa),this._intersectConvex(e.pillarConvex,t,qa,i,s,Bd)}}}_intersectSphere(e,t,n,i,s){let o=this.from,l=this.to,c=e.radius,h=(l.x-o.x)**2+(l.y-o.y)**2+(l.z-o.z)**2,a=2*((l.x-o.x)*(o.x-n.x)+(l.y-o.y)*(o.y-n.y)+(l.z-o.z)*(o.z-n.z)),u=(o.x-n.x)**2+(o.y-n.y)**2+(o.z-n.z)**2-c**2,d=a**2-4*h*u,f=G_,m=W_;if(!(d<0))if(d===0)o.lerp(l,d,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,s,i,-1);else{let x=(-a-Math.sqrt(d))/(2*h),p=(-a+Math.sqrt(d))/(2*h);if(x>=0&&x<=1&&(o.lerp(l,x,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,s,i,-1)),this.result.shouldStop)return;p>=0&&p<=1&&(o.lerp(l,p,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,s,i,-1))}}_intersectConvex(e,t,n,i,s,o){let l=q_,c=Ud,h=o&&o.faceList||null,a=e.faces,u=e.vertices,d=e.faceNormals,f=this.direction,m=this.from,x=this.to,p=m.distanceTo(x),g=h?h.length:a.length,_=this.result;for(let y=0;!_.shouldStop&&y<g;y++){let v=h?h[y]:y,T=a[v],A=d[v],C=t,R=n;c.copy(u[T[0]]),C.vmult(c,c),c.vadd(R,c),c.vsub(m,c),C.vmult(A,l);let M=f.dot(l);if(Math.abs(M)<this.precision)continue;let b=l.dot(c)/M;if(!(b<0)){f.scale(b,$t),$t.vadd(m,$t),Sn.copy(u[T[0]]),C.vmult(Sn,Sn),R.vadd(Sn,Sn);for(let P=1;!_.shouldStop&&P<T.length-1;P++){Dn.copy(u[T[P]]),Fn.copy(u[T[P+1]]),C.vmult(Dn,Dn),C.vmult(Fn,Fn),R.vadd(Dn,Dn),R.vadd(Fn,Fn);let B=$t.distanceTo(m);!(r.pointInTriangle($t,Sn,Dn,Fn)||r.pointInTriangle($t,Dn,Sn,Fn))||B>p||this.reportIntersection(l,$t,s,i,v)}}}}_intersectTrimesh(e,t,n,i,s,o){let l=$_,c=ev,h=tv,a=Ud,u=Z_,d=j_,f=K_,m=Q_,x=J_,p=e.indices;e.vertices;let g=this.from,_=this.to,y=this.direction;h.position.copy(n),h.quaternion.copy(t),Qe.vectorToLocalFrame(n,t,y,u),Qe.pointToLocalFrame(n,t,g,d),Qe.pointToLocalFrame(n,t,_,f),f.x*=e.scale.x,f.y*=e.scale.y,f.z*=e.scale.z,d.x*=e.scale.x,d.y*=e.scale.y,d.z*=e.scale.z,f.vsub(d,u),u.normalize();let v=d.distanceSquared(f);e.tree.rayQuery(this,h,c);for(let T=0,A=c.length;!this.result.shouldStop&&T!==A;T++){let C=c[T];e.getNormal(C,l),e.getVertex(p[C*3],Sn),Sn.vsub(d,a);let R=u.dot(l),M=l.dot(a)/R;if(M<0)continue;u.scale(M,$t),$t.vadd(d,$t),e.getVertex(p[C*3+1],Dn),e.getVertex(p[C*3+2],Fn);let b=$t.distanceSquared(d);!(r.pointInTriangle($t,Dn,Sn,Fn)||r.pointInTriangle($t,Sn,Dn,Fn))||b>v||(Qe.vectorToWorldFrame(t,l,x),Qe.pointToWorldFrame(n,t,$t,m),this.reportIntersection(x,m,s,i,C))}c.length=0}reportIntersection(e,t,n,i,s){let o=this.from,l=this.to,c=o.distanceTo(t),h=this.result;if(!(this.skipBackfaces&&e.dot(this.direction)>0))switch(h.hitFaceIndex=typeof s<"u"?s:-1,this.mode){case r.ALL:this.hasHit=!0,h.set(o,l,e,t,n,i,c),h.hasHit=!0,this.callback(h);break;case r.CLOSEST:(c<h.distance||!h.hasHit)&&(this.hasHit=!0,h.hasHit=!0,h.set(o,l,e,t,n,i,c));break;case r.ANY:this.hasHit=!0,h.hasHit=!0,h.set(o,l,e,t,n,i,c),h.shouldStop=!0;break}}static pointInTriangle(e,t,n,i){i.vsub(t,qi),n.vsub(t,Rr),e.vsub(t,qc);let s=qi.dot(qi),o=qi.dot(Rr),l=qi.dot(qc),c=Rr.dot(Rr),h=Rr.dot(qc),a,u;return(a=c*l-o*h)>=0&&(u=s*h-o*l)>=0&&a+u<s*c-o*o}};dn.CLOSEST=oh.CLOSEST;dn.ANY=oh.ANY;dn.ALL=oh.ALL;var Fd=new nn,Wc=[],Rr=new S,qc=new S,O_=new S,k_=new Wt,$t=new S,Sn=new S,Dn=new S,Fn=new S;new S;new vi;var Bd={faceList:[0]},qa=new S,V_=new dn,H_=[],G_=new S,W_=new S,q_=new S,X_=new S,Y_=new S,Ud=new S,$_=new S,Z_=new S,j_=new S,K_=new S,J_=new S,Q_=new S;new nn;var ev=[],tv=new Qe,qi=new S,Xa=new S;function nv(r,e,t){t.vsub(r,qi);let n=qi.dot(e);return e.scale(n,Xa),Xa.vadd(r,Xa),t.distanceTo(Xa)}var Qa=class r extends Ja{static checkBounds(e,t,n){let i,s;n===0?(i=e.position.x,s=t.position.x):n===1?(i=e.position.y,s=t.position.y):n===2&&(i=e.position.z,s=t.position.z);let o=e.boundingRadius,l=t.boundingRadius,c=i+o;return s-l<c}static insertionSortX(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],s;for(s=t-1;s>=0&&!(e[s].aabb.lowerBound.x<=i.aabb.lowerBound.x);s--)e[s+1]=e[s];e[s+1]=i}return e}static insertionSortY(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],s;for(s=t-1;s>=0&&!(e[s].aabb.lowerBound.y<=i.aabb.lowerBound.y);s--)e[s+1]=e[s];e[s+1]=i}return e}static insertionSortZ(e){for(let t=1,n=e.length;t<n;t++){let i=e[t],s;for(s=t-1;s>=0&&!(e[s].aabb.lowerBound.z<=i.aabb.lowerBound.z);s--)e[s+1]=e[s];e[s+1]=i}return e}constructor(e){super(),this.axisList=[],this.world=null,this.axisIndex=0;let t=this.axisList;this._addBodyHandler=n=>{t.push(n.body)},this._removeBodyHandler=n=>{let i=t.indexOf(n.body);i!==-1&&t.splice(i,1)},e&&this.setWorld(e)}setWorld(e){this.axisList.length=0;for(let t=0;t<e.bodies.length;t++)this.axisList.push(e.bodies[t]);e.removeEventListener("addBody",this._addBodyHandler),e.removeEventListener("removeBody",this._removeBodyHandler),e.addEventListener("addBody",this._addBodyHandler),e.addEventListener("removeBody",this._removeBodyHandler),this.world=e,this.dirty=!0}collisionPairs(e,t,n){let i=this.axisList,s=i.length,o=this.axisIndex,l,c;for(this.dirty&&(this.sortList(),this.dirty=!1),l=0;l!==s;l++){let h=i[l];for(c=l+1;c<s;c++){let a=i[c];if(this.needBroadphaseCollision(h,a)){if(!r.checkBounds(h,a,o))break;this.intersectionTest(h,a,t,n)}}}}sortList(){let e=this.axisList,t=this.axisIndex,n=e.length;for(let i=0;i!==n;i++){let s=e[i];s.aabbNeedsUpdate&&s.updateAABB()}t===0?r.insertionSortX(e):t===1?r.insertionSortY(e):t===2&&r.insertionSortZ(e)}autoDetectAxis(){let e=0,t=0,n=0,i=0,s=0,o=0,l=this.axisList,c=l.length,h=1/c;for(let f=0;f!==c;f++){let m=l[f],x=m.position.x;e+=x,t+=x*x;let p=m.position.y;n+=p,i+=p*p;let g=m.position.z;s+=g,o+=g*g}let a=t-e*e*h,u=i-n*n*h,d=o-s*s*h;a>u?a>d?this.axisIndex=0:this.axisIndex=2:u>d?this.axisIndex=1:this.axisIndex=2}aabbQuery(e,t,n){n===void 0&&(n=[]),this.dirty&&(this.sortList(),this.dirty=!1);let i=this.axisIndex,s="x";i===1&&(s="y"),i===2&&(s="z");let o=this.axisList;t.lowerBound[s],t.upperBound[s];for(let l=0;l<o.length;l++){let c=o[l];c.aabbNeedsUpdate&&c.updateAABB(),c.aabb.overlaps(t)&&n.push(c)}return n}},el=class{static defaults(e,t){e===void 0&&(e={});for(let n in t)n in e||(e[n]=t[n]);return e}},jc=class r{constructor(e,t,n){n===void 0&&(n={}),n=el.defaults(n,{collideConnected:!0,wakeUpBodies:!0}),this.equations=[],this.bodyA=e,this.bodyB=t,this.id=r.idCounter++,this.collideConnected=n.collideConnected,n.wakeUpBodies&&(e&&e.wakeUp(),t&&t.wakeUp())}update(){throw new Error("method update() not implmemented in this Constraint subclass!")}enable(){let e=this.equations;for(let t=0;t<e.length;t++)e[t].enabled=!0}disable(){let e=this.equations;for(let t=0;t<e.length;t++)e[t].enabled=!1}};jc.idCounter=0;var tl=class{constructor(){this.spatial=new S,this.rotational=new S}multiplyElement(e){return e.spatial.dot(this.spatial)+e.rotational.dot(this.rotational)}multiplyVectors(e,t){return e.dot(this.spatial)+t.dot(this.rotational)}},Dr=class r{constructor(e,t,n,i){n===void 0&&(n=-1e6),i===void 0&&(i=1e6),this.id=r.idCounter++,this.minForce=n,this.maxForce=i,this.bi=e,this.bj=t,this.a=0,this.b=0,this.eps=0,this.jacobianElementA=new tl,this.jacobianElementB=new tl,this.enabled=!0,this.multiplier=0,this.setSpookParams(1e7,4,1/60)}setSpookParams(e,t,n){let i=t,s=e,o=n;this.a=4/(o*(1+4*i)),this.b=4*i/(1+4*i),this.eps=4/(o*o*s*(1+4*i))}computeB(e,t,n){let i=this.computeGW(),s=this.computeGq(),o=this.computeGiMf();return-s*e-i*t-o*n}computeGq(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,s=n.position,o=i.position;return e.spatial.dot(s)+t.spatial.dot(o)}computeGW(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,s=n.velocity,o=i.velocity,l=n.angularVelocity,c=i.angularVelocity;return e.multiplyVectors(s,l)+t.multiplyVectors(o,c)}computeGWlambda(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,s=n.vlambda,o=i.vlambda,l=n.wlambda,c=i.wlambda;return e.multiplyVectors(s,l)+t.multiplyVectors(o,c)}computeGiMf(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,s=n.force,o=n.torque,l=i.force,c=i.torque,h=n.invMassSolve,a=i.invMassSolve;return s.scale(h,zd),l.scale(a,Od),n.invInertiaWorldSolve.vmult(o,kd),i.invInertiaWorldSolve.vmult(c,Vd),e.multiplyVectors(zd,kd)+t.multiplyVectors(Od,Vd)}computeGiMGt(){let e=this.jacobianElementA,t=this.jacobianElementB,n=this.bi,i=this.bj,s=n.invMassSolve,o=i.invMassSolve,l=n.invInertiaWorldSolve,c=i.invInertiaWorldSolve,h=s+o;return l.vmult(e.rotational,Ya),h+=Ya.dot(e.rotational),c.vmult(t.rotational,Ya),h+=Ya.dot(t.rotational),h}addToWlambda(e){let t=this.jacobianElementA,n=this.jacobianElementB,i=this.bi,s=this.bj,o=iv;i.vlambda.addScaledVector(i.invMassSolve*e,t.spatial,i.vlambda),s.vlambda.addScaledVector(s.invMassSolve*e,n.spatial,s.vlambda),i.invInertiaWorldSolve.vmult(t.rotational,o),i.wlambda.addScaledVector(e,o,i.wlambda),s.invInertiaWorldSolve.vmult(n.rotational,o),s.wlambda.addScaledVector(e,o,s.wlambda)}computeC(){return this.computeGiMGt()+this.eps}};Dr.idCounter=0;var zd=new S,Od=new S,kd=new S,Vd=new S,Ya=new S,iv=new S,Kc=class extends Dr{constructor(e,t,n){n===void 0&&(n=1e6),super(e,t,0,n),this.restitution=0,this.ri=new S,this.rj=new S,this.ni=new S}computeB(e){let t=this.a,n=this.b,i=this.bi,s=this.bj,o=this.ri,l=this.rj,c=sv,h=rv,a=i.velocity,u=i.angularVelocity;i.force,i.torque;let d=s.velocity,f=s.angularVelocity;s.force,s.torque;let m=ov,x=this.jacobianElementA,p=this.jacobianElementB,g=this.ni;o.cross(g,c),l.cross(g,h),g.negate(x.spatial),c.negate(x.rotational),p.spatial.copy(g),p.rotational.copy(h),m.copy(s.position),m.vadd(l,m),m.vsub(i.position,m),m.vsub(o,m);let _=g.dot(m),y=this.restitution+1,v=y*d.dot(g)-y*a.dot(g)+f.dot(h)-u.dot(c),T=this.computeGiMf();return-_*t-v*n-e*T}getImpactVelocityAlongNormal(){let e=av,t=lv,n=cv,i=hv,s=uv;return this.bi.position.vadd(this.ri,n),this.bj.position.vadd(this.rj,i),this.bi.getVelocityAtWorldPoint(n,e),this.bj.getVelocityAtWorldPoint(i,t),e.vsub(t,s),this.ni.dot(s)}},sv=new S,rv=new S,ov=new S,av=new S,lv=new S,cv=new S,hv=new S,uv=new S;var QM=new S,eS=new S;var tS=new S,nS=new S;new S;new S;var iS=new S,sS=new S;var rS=new S,oS=new S,nl=class extends Dr{constructor(e,t,n){super(e,t,-n,n),this.ri=new S,this.rj=new S,this.t=new S}computeB(e){this.a;let t=this.b;this.bi,this.bj;let n=this.ri,i=this.rj,s=dv,o=fv,l=this.t;n.cross(l,s),i.cross(l,o);let c=this.jacobianElementA,h=this.jacobianElementB;l.negate(c.spatial),s.negate(c.rotational),h.spatial.copy(l),h.rotational.copy(o);let a=this.computeGW(),u=this.computeGiMf();return-a*t-e*u}},dv=new S,fv=new S,il=class r{constructor(e,t,n){n=el.defaults(n,{friction:.3,restitution:.3,contactEquationStiffness:1e7,contactEquationRelaxation:3,frictionEquationStiffness:1e7,frictionEquationRelaxation:3}),this.id=r.idCounter++,this.materials=[e,t],this.friction=n.friction,this.restitution=n.restitution,this.contactEquationStiffness=n.contactEquationStiffness,this.contactEquationRelaxation=n.contactEquationRelaxation,this.frictionEquationStiffness=n.frictionEquationStiffness,this.frictionEquationRelaxation=n.frictionEquationRelaxation}};il.idCounter=0;var sl=class r{constructor(e){e===void 0&&(e={});let t="";typeof e=="string"&&(t=e,e={}),this.name=t,this.id=r.idCounter++,this.friction=typeof e.friction<"u"?e.friction:-1,this.restitution=typeof e.restitution<"u"?e.restitution:-1}};sl.idCounter=0;var aS=new S,lS=new S,cS=new S,hS=new S,uS=new S,dS=new S,fS=new S,pS=new S,mS=new S,gS=new S,xS=new S;var _S=new S,vS=new S;new S;new S;new S;var yS=new S,bS=new S,wS=new S;new dn;new S;var MS=new S,SS=new S,AS=[new S(1,0,0),new S(0,1,0),new S(0,0,1)],TS=new S;var ES=new S,CS=new S,RS=new S;var IS=new S,PS=new S,LS=new S,NS=new S;var DS=new S,FS=new S,BS=new S;var Fr=class extends me{constructor(e){if(super({type:me.types.SPHERE}),this.radius=e!==void 0?e:1,this.radius<0)throw new Error("The sphere radius cannot be negative.");this.updateBoundingSphereRadius()}calculateLocalInertia(e,t){t===void 0&&(t=new S);let n=2*e*this.radius*this.radius/5;return t.x=n,t.y=n,t.z=n,t}volume(){return 4*Math.PI*Math.pow(this.radius,3)/3}updateBoundingSphereRadius(){this.boundingSphereRadius=this.radius}calculateWorldAABB(e,t,n,i){let s=this.radius,o=["x","y","z"];for(let l=0;l<o.length;l++){let c=o[l];n[c]=e[c]-s,i[c]=e[c]+s}}};var US=new S,zS=new S;var OS=new S,kS=new S,VS=new S,HS=new S,GS=new S,WS=new S,qS=new S;var XS=new S;var YS=new S,$S=new S,ZS=new S,jS=new S,KS=new S,JS=new S,QS=new S,e1=new S,t1=new S;var n1=new S,i1=new nn;var s1=new S,r1=new nn,o1=new S,a1=new S,l1=new S,c1=new S,h1=new S,u1=new S,d1=new S,f1=new nn,p1=new S,m1=new Qe,g1=new nn,Jc=class{constructor(){this.equations=[]}solve(e,t){return 0}addEquation(e){e.enabled&&!e.bi.isTrigger&&!e.bj.isTrigger&&this.equations.push(e)}removeEquation(e){let t=this.equations,n=t.indexOf(e);n!==-1&&t.splice(n,1)}removeAllEquations(){this.equations.length=0}},Qc=class extends Jc{constructor(){super(),this.iterations=10,this.tolerance=1e-7}solve(e,t){let n=0,i=this.iterations,s=this.tolerance*this.tolerance,o=this.equations,l=o.length,c=t.bodies,h=c.length,a=e,u,d,f,m,x,p;if(l!==0)for(let v=0;v!==h;v++)c[v].updateSolveMassProperties();let g=mv,_=gv,y=pv;g.length=l,_.length=l,y.length=l;for(let v=0;v!==l;v++){let T=o[v];y[v]=0,_[v]=T.computeB(a),g[v]=1/T.computeC()}if(l!==0){for(let A=0;A!==h;A++){let C=c[A],R=C.vlambda,M=C.wlambda;R.set(0,0,0),M.set(0,0,0)}for(n=0;n!==i;n++){m=0;for(let A=0;A!==l;A++){let C=o[A];u=_[A],d=g[A],p=y[A],x=C.computeGWlambda(),f=d*(u-x-C.eps*p),p+f<C.minForce?f=C.minForce-p:p+f>C.maxForce&&(f=C.maxForce-p),y[A]+=f,m+=f>0?f:-f,C.addToWlambda(f)}if(m*m<s)break}for(let A=0;A!==h;A++){let C=c[A],R=C.velocity,M=C.angularVelocity;C.vlambda.vmul(C.linearFactor,C.vlambda),R.vadd(C.vlambda,R),C.wlambda.vmul(C.angularFactor,C.wlambda),M.vadd(C.wlambda,M)}let v=o.length,T=1/a;for(;v--;)o[v].multiplier=y[v]*T}return n}},pv=[],mv=[],gv=[];var x1=He.STATIC;var eh=class{constructor(){this.objects=[],this.type=Object}release(){let e=arguments.length;for(let t=0;t!==e;t++)this.objects.push(t<0||arguments.length<=t?void 0:arguments[t]);return this}get(){return this.objects.length===0?this.constructObject():this.objects.pop()}constructObject(){throw new Error("constructObject() not implemented in this Pool subclass yet!")}resize(e){let t=this.objects;for(;t.length>e;)t.pop();for(;t.length<e;)t.push(this.constructObject());return this}},th=class extends eh{constructor(){super(...arguments),this.type=S}constructObject(){return new S}},ut={sphereSphere:me.types.SPHERE,spherePlane:me.types.SPHERE|me.types.PLANE,boxBox:me.types.BOX|me.types.BOX,sphereBox:me.types.SPHERE|me.types.BOX,planeBox:me.types.PLANE|me.types.BOX,convexConvex:me.types.CONVEXPOLYHEDRON,sphereConvex:me.types.SPHERE|me.types.CONVEXPOLYHEDRON,planeConvex:me.types.PLANE|me.types.CONVEXPOLYHEDRON,boxConvex:me.types.BOX|me.types.CONVEXPOLYHEDRON,sphereHeightfield:me.types.SPHERE|me.types.HEIGHTFIELD,boxHeightfield:me.types.BOX|me.types.HEIGHTFIELD,convexHeightfield:me.types.CONVEXPOLYHEDRON|me.types.HEIGHTFIELD,sphereParticle:me.types.PARTICLE|me.types.SPHERE,planeParticle:me.types.PLANE|me.types.PARTICLE,boxParticle:me.types.BOX|me.types.PARTICLE,convexParticle:me.types.PARTICLE|me.types.CONVEXPOLYHEDRON,cylinderCylinder:me.types.CYLINDER,sphereCylinder:me.types.SPHERE|me.types.CYLINDER,planeCylinder:me.types.PLANE|me.types.CYLINDER,boxCylinder:me.types.BOX|me.types.CYLINDER,convexCylinder:me.types.CONVEXPOLYHEDRON|me.types.CYLINDER,heightfieldCylinder:me.types.HEIGHTFIELD|me.types.CYLINDER,particleCylinder:me.types.PARTICLE|me.types.CYLINDER,sphereTrimesh:me.types.SPHERE|me.types.TRIMESH,planeTrimesh:me.types.PLANE|me.types.TRIMESH},nh=class{get[ut.sphereSphere](){return this.sphereSphere}get[ut.spherePlane](){return this.spherePlane}get[ut.boxBox](){return this.boxBox}get[ut.sphereBox](){return this.sphereBox}get[ut.planeBox](){return this.planeBox}get[ut.convexConvex](){return this.convexConvex}get[ut.sphereConvex](){return this.sphereConvex}get[ut.planeConvex](){return this.planeConvex}get[ut.boxConvex](){return this.boxConvex}get[ut.sphereHeightfield](){return this.sphereHeightfield}get[ut.boxHeightfield](){return this.boxHeightfield}get[ut.convexHeightfield](){return this.convexHeightfield}get[ut.sphereParticle](){return this.sphereParticle}get[ut.planeParticle](){return this.planeParticle}get[ut.boxParticle](){return this.boxParticle}get[ut.convexParticle](){return this.convexParticle}get[ut.cylinderCylinder](){return this.convexConvex}get[ut.sphereCylinder](){return this.sphereConvex}get[ut.planeCylinder](){return this.planeConvex}get[ut.boxCylinder](){return this.boxConvex}get[ut.convexCylinder](){return this.convexConvex}get[ut.heightfieldCylinder](){return this.heightfieldCylinder}get[ut.particleCylinder](){return this.particleCylinder}get[ut.sphereTrimesh](){return this.sphereTrimesh}get[ut.planeTrimesh](){return this.planeTrimesh}constructor(e){this.contactPointPool=[],this.frictionEquationPool=[],this.result=[],this.frictionResult=[],this.v3pool=new th,this.world=e,this.currentContactMaterial=e.defaultContactMaterial,this.enableFrictionReduction=!1}createContactEquation(e,t,n,i,s,o){let l;this.contactPointPool.length?(l=this.contactPointPool.pop(),l.bi=e,l.bj=t):l=new Kc(e,t),l.enabled=e.collisionResponse&&t.collisionResponse&&n.collisionResponse&&i.collisionResponse;let c=this.currentContactMaterial;l.restitution=c.restitution,l.setSpookParams(c.contactEquationStiffness,c.contactEquationRelaxation,this.world.dt);let h=n.material||e.material,a=i.material||t.material;return h&&a&&h.restitution>=0&&a.restitution>=0&&(l.restitution=h.restitution*a.restitution),l.si=s||n,l.sj=o||i,l}createFrictionEquationsFromContact(e,t){let n=e.bi,i=e.bj,s=e.si,o=e.sj,l=this.world,c=this.currentContactMaterial,h=c.friction,a=s.material||n.material,u=o.material||i.material;if(a&&u&&a.friction>=0&&u.friction>=0&&(h=a.friction*u.friction),h>0){let d=h*(l.frictionGravity||l.gravity).length(),f=n.invMass+i.invMass;f>0&&(f=1/f);let m=this.frictionEquationPool,x=m.length?m.pop():new nl(n,i,d*f),p=m.length?m.pop():new nl(n,i,d*f);return x.bi=p.bi=n,x.bj=p.bj=i,x.minForce=p.minForce=-d*f,x.maxForce=p.maxForce=d*f,x.ri.copy(e.ri),x.rj.copy(e.rj),p.ri.copy(e.ri),p.rj.copy(e.rj),e.ni.tangents(x.t,p.t),x.setSpookParams(c.frictionEquationStiffness,c.frictionEquationRelaxation,l.dt),p.setSpookParams(c.frictionEquationStiffness,c.frictionEquationRelaxation,l.dt),x.enabled=p.enabled=e.enabled,t.push(x,p),!0}return!1}createFrictionFromAverage(e){let t=this.result[this.result.length-1];if(!this.createFrictionEquationsFromContact(t,this.frictionResult)||e===1)return;let n=this.frictionResult[this.frictionResult.length-2],i=this.frictionResult[this.frictionResult.length-1];Wi.setZero(),Rs.setZero(),Is.setZero();let s=t.bi;t.bj;for(let l=0;l!==e;l++)t=this.result[this.result.length-1-l],t.bi!==s?(Wi.vadd(t.ni,Wi),Rs.vadd(t.ri,Rs),Is.vadd(t.rj,Is)):(Wi.vsub(t.ni,Wi),Rs.vadd(t.rj,Rs),Is.vadd(t.ri,Is));let o=1/e;Rs.scale(o,n.ri),Is.scale(o,n.rj),i.ri.copy(n.ri),i.rj.copy(n.rj),Wi.normalize(),Wi.tangents(n.t,i.t)}getContacts(e,t,n,i,s,o,l){this.contactPointPool=s,this.frictionEquationPool=l,this.result=i,this.frictionResult=o;let c=vv,h=yv,a=xv,u=_v;for(let d=0,f=e.length;d!==f;d++){let m=e[d],x=t[d],p=null;m.material&&x.material&&(p=n.getContactMaterial(m.material,x.material)||null);let g=m.type&He.KINEMATIC&&x.type&He.STATIC||m.type&He.STATIC&&x.type&He.KINEMATIC||m.type&He.KINEMATIC&&x.type&He.KINEMATIC;for(let _=0;_<m.shapes.length;_++){m.quaternion.mult(m.shapeOrientations[_],c),m.quaternion.vmult(m.shapeOffsets[_],a),a.vadd(m.position,a);let y=m.shapes[_];for(let v=0;v<x.shapes.length;v++){x.quaternion.mult(x.shapeOrientations[v],h),x.quaternion.vmult(x.shapeOffsets[v],u),u.vadd(x.position,u);let T=x.shapes[v];if(!(y.collisionFilterMask&T.collisionFilterGroup&&T.collisionFilterMask&y.collisionFilterGroup)||a.distanceTo(u)>y.boundingSphereRadius+T.boundingSphereRadius)continue;let A=null;y.material&&T.material&&(A=n.getContactMaterial(y.material,T.material)||null),this.currentContactMaterial=A||p||n.defaultContactMaterial;let C=y.type|T.type,R=this[C];if(R){let M=!1;y.type<T.type?M=R.call(this,y,T,a,u,c,h,m,x,y,T,g):M=R.call(this,T,y,u,a,h,c,x,m,y,T,g),M&&g&&(n.shapeOverlapKeeper.set(y.id,T.id),n.bodyOverlapKeeper.set(m.id,x.id))}}}}}sphereSphere(e,t,n,i,s,o,l,c,h,a,u){if(u)return n.distanceSquared(i)<(e.radius+t.radius)**2;let d=this.createContactEquation(l,c,e,t,h,a);i.vsub(n,d.ni),d.ni.normalize(),d.ri.copy(d.ni),d.rj.copy(d.ni),d.ri.scale(e.radius,d.ri),d.rj.scale(-t.radius,d.rj),d.ri.vadd(n,d.ri),d.ri.vsub(l.position,d.ri),d.rj.vadd(i,d.rj),d.rj.vsub(c.position,d.rj),this.result.push(d),this.createFrictionEquationsFromContact(d,this.frictionResult)}spherePlane(e,t,n,i,s,o,l,c,h,a,u){let d=this.createContactEquation(l,c,e,t,h,a);if(d.ni.set(0,0,1),o.vmult(d.ni,d.ni),d.ni.negate(d.ni),d.ni.normalize(),d.ni.scale(e.radius,d.ri),n.vsub(i,$a),d.ni.scale(d.ni.dot($a),Hd),$a.vsub(Hd,d.rj),-$a.dot(d.ni)<=e.radius){if(u)return!0;let f=d.ri,m=d.rj;f.vadd(n,f),f.vsub(l.position,f),m.vadd(i,m),m.vsub(c.position,m),this.result.push(d),this.createFrictionEquationsFromContact(d,this.frictionResult)}}boxBox(e,t,n,i,s,o,l,c,h,a,u){return e.convexPolyhedronRepresentation.material=e.material,t.convexPolyhedronRepresentation.material=t.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,this.convexConvex(e.convexPolyhedronRepresentation,t.convexPolyhedronRepresentation,n,i,s,o,l,c,e,t,u)}sphereBox(e,t,n,i,s,o,l,c,h,a,u){let d=this.v3pool,f=Xv;n.vsub(i,Za),t.getSideNormals(f,o);let m=e.radius,x=!1,p=$v,g=Zv,_=jv,y=null,v=0,T=0,A=0,C=null;for(let D=0,j=f.length;D!==j&&x===!1;D++){let H=Gv;H.copy(f[D]);let Z=H.length();H.normalize();let ae=Za.dot(H);if(ae<Z+m&&ae>0){let de=Wv,re=qv;de.copy(f[(D+1)%3]),re.copy(f[(D+2)%3]);let Ze=de.length(),et=re.length();de.normalize(),re.normalize();let Ye=Za.dot(de),$=Za.dot(re);if(Ye<Ze&&Ye>-Ze&&$<et&&$>-et){let Q=Math.abs(ae-Z-m);if((C===null||Q<C)&&(C=Q,T=Ye,A=$,y=Z,p.copy(H),g.copy(de),_.copy(re),v++,u))return!0}}}if(v){x=!0;let D=this.createContactEquation(l,c,e,t,h,a);p.scale(-m,D.ri),D.ni.copy(p),D.ni.negate(D.ni),p.scale(y,p),g.scale(T,g),p.vadd(g,p),_.scale(A,_),p.vadd(_,D.rj),D.ri.vadd(n,D.ri),D.ri.vsub(l.position,D.ri),D.rj.vadd(i,D.rj),D.rj.vsub(c.position,D.rj),this.result.push(D),this.createFrictionEquationsFromContact(D,this.frictionResult)}let R=d.get(),M=Yv;for(let D=0;D!==2&&!x;D++)for(let j=0;j!==2&&!x;j++)for(let H=0;H!==2&&!x;H++)if(R.set(0,0,0),D?R.vadd(f[0],R):R.vsub(f[0],R),j?R.vadd(f[1],R):R.vsub(f[1],R),H?R.vadd(f[2],R):R.vsub(f[2],R),i.vadd(R,M),M.vsub(n,M),M.lengthSquared()<m*m){if(u)return!0;x=!0;let Z=this.createContactEquation(l,c,e,t,h,a);Z.ri.copy(M),Z.ri.normalize(),Z.ni.copy(Z.ri),Z.ri.scale(m,Z.ri),Z.rj.copy(R),Z.ri.vadd(n,Z.ri),Z.ri.vsub(l.position,Z.ri),Z.rj.vadd(i,Z.rj),Z.rj.vsub(c.position,Z.rj),this.result.push(Z),this.createFrictionEquationsFromContact(Z,this.frictionResult)}d.release(R),R=null;let b=d.get(),P=d.get(),B=d.get(),L=d.get(),U=d.get(),O=f.length;for(let D=0;D!==O&&!x;D++)for(let j=0;j!==O&&!x;j++)if(D%3!==j%3){f[j].cross(f[D],b),b.normalize(),f[D].vadd(f[j],P),B.copy(n),B.vsub(P,B),B.vsub(i,B);let H=B.dot(b);b.scale(H,L);let Z=0;for(;Z===D%3||Z===j%3;)Z++;U.copy(n),U.vsub(L,U),U.vsub(P,U),U.vsub(i,U);let ae=Math.abs(H),de=U.length();if(ae<f[Z].length()&&de<m){if(u)return!0;x=!0;let re=this.createContactEquation(l,c,e,t,h,a);P.vadd(L,re.rj),re.rj.copy(re.rj),U.negate(re.ni),re.ni.normalize(),re.ri.copy(re.rj),re.ri.vadd(i,re.ri),re.ri.vsub(n,re.ri),re.ri.normalize(),re.ri.scale(m,re.ri),re.ri.vadd(n,re.ri),re.ri.vsub(l.position,re.ri),re.rj.vadd(i,re.rj),re.rj.vsub(c.position,re.rj),this.result.push(re),this.createFrictionEquationsFromContact(re,this.frictionResult)}}d.release(b,P,B,L,U)}planeBox(e,t,n,i,s,o,l,c,h,a,u){return t.convexPolyhedronRepresentation.material=t.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,t.convexPolyhedronRepresentation.id=t.id,this.planeConvex(e,t.convexPolyhedronRepresentation,n,i,s,o,l,c,e,t,u)}convexConvex(e,t,n,i,s,o,l,c,h,a,u,d,f){let m=uy;if(!(n.distanceTo(i)>e.boundingSphereRadius+t.boundingSphereRadius)&&e.findSeparatingAxis(t,n,s,i,o,m,d,f)){let x=[],p=dy;e.clipAgainstHull(n,s,t,i,o,m,-100,100,x);let g=0;for(let _=0;_!==x.length;_++){if(u)return!0;let y=this.createContactEquation(l,c,e,t,h,a),v=y.ri,T=y.rj;m.negate(y.ni),x[_].normal.negate(p),p.scale(x[_].depth,p),x[_].point.vadd(p,v),T.copy(x[_].point),v.vsub(n,v),T.vsub(i,T),v.vadd(n,v),v.vsub(l.position,v),T.vadd(i,T),T.vsub(c.position,T),this.result.push(y),g++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(y,this.frictionResult)}this.enableFrictionReduction&&g&&this.createFrictionFromAverage(g)}}sphereConvex(e,t,n,i,s,o,l,c,h,a,u){let d=this.v3pool;n.vsub(i,Kv);let f=t.faceNormals,m=t.faces,x=t.vertices,p=e.radius,g=!1;for(let _=0;_!==x.length;_++){let y=x[_],v=ty;o.vmult(y,v),i.vadd(v,v);let T=ey;if(v.vsub(n,T),T.lengthSquared()<p*p){if(u)return!0;g=!0;let A=this.createContactEquation(l,c,e,t,h,a);A.ri.copy(T),A.ri.normalize(),A.ni.copy(A.ri),A.ri.scale(p,A.ri),v.vsub(i,A.rj),A.ri.vadd(n,A.ri),A.ri.vsub(l.position,A.ri),A.rj.vadd(i,A.rj),A.rj.vsub(c.position,A.rj),this.result.push(A),this.createFrictionEquationsFromContact(A,this.frictionResult);return}}for(let _=0,y=m.length;_!==y&&g===!1;_++){let v=f[_],T=m[_],A=ny;o.vmult(v,A);let C=iy;o.vmult(x[T[0]],C),C.vadd(i,C);let R=sy;A.scale(-p,R),n.vadd(R,R);let M=ry;R.vsub(C,M);let b=M.dot(A),P=oy;if(n.vsub(C,P),b<0&&P.dot(A)>0){let B=[];for(let L=0,U=T.length;L!==U;L++){let O=d.get();o.vmult(x[T[L]],O),i.vadd(O,O),B.push(O)}if(Hv(B,A,n)){if(u)return!0;g=!0;let L=this.createContactEquation(l,c,e,t,h,a);A.scale(-p,L.ri),A.negate(L.ni);let U=d.get();A.scale(-b,U);let O=d.get();A.scale(-p,O),n.vsub(i,L.rj),L.rj.vadd(O,L.rj),L.rj.vadd(U,L.rj),L.rj.vadd(i,L.rj),L.rj.vsub(c.position,L.rj),L.ri.vadd(n,L.ri),L.ri.vsub(l.position,L.ri),d.release(U),d.release(O),this.result.push(L),this.createFrictionEquationsFromContact(L,this.frictionResult);for(let D=0,j=B.length;D!==j;D++)d.release(B[D]);return}else for(let L=0;L!==T.length;L++){let U=d.get(),O=d.get();o.vmult(x[T[(L+1)%T.length]],U),o.vmult(x[T[(L+2)%T.length]],O),i.vadd(U,U),i.vadd(O,O);let D=Jv;O.vsub(U,D);let j=Qv;D.unit(j);let H=d.get(),Z=d.get();n.vsub(U,Z);let ae=Z.dot(j);j.scale(ae,H),H.vadd(U,H);let de=d.get();if(H.vsub(n,de),ae>0&&ae*ae<D.lengthSquared()&&de.lengthSquared()<p*p){if(u)return!0;let re=this.createContactEquation(l,c,e,t,h,a);H.vsub(i,re.rj),H.vsub(n,re.ni),re.ni.normalize(),re.ni.scale(p,re.ri),re.rj.vadd(i,re.rj),re.rj.vsub(c.position,re.rj),re.ri.vadd(n,re.ri),re.ri.vsub(l.position,re.ri),this.result.push(re),this.createFrictionEquationsFromContact(re,this.frictionResult);for(let Ze=0,et=B.length;Ze!==et;Ze++)d.release(B[Ze]);d.release(U),d.release(O),d.release(H),d.release(de),d.release(Z);return}d.release(U),d.release(O),d.release(H),d.release(de),d.release(Z)}for(let L=0,U=B.length;L!==U;L++)d.release(B[L])}}}planeConvex(e,t,n,i,s,o,l,c,h,a,u){let d=ay,f=ly;f.set(0,0,1),s.vmult(f,f);let m=0,x=cy;for(let p=0;p!==t.vertices.length;p++)if(d.copy(t.vertices[p]),o.vmult(d,d),i.vadd(d,d),d.vsub(n,x),f.dot(x)<=0){if(u)return!0;let _=this.createContactEquation(l,c,e,t,h,a),y=hy;f.scale(f.dot(x),y),d.vsub(y,y),y.vsub(n,_.ri),_.ni.copy(f),d.vsub(i,_.rj),_.ri.vadd(n,_.ri),_.ri.vsub(l.position,_.ri),_.rj.vadd(i,_.rj),_.rj.vsub(c.position,_.rj),this.result.push(_),m++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(_,this.frictionResult)}this.enableFrictionReduction&&m&&this.createFrictionFromAverage(m)}boxConvex(e,t,n,i,s,o,l,c,h,a,u){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexConvex(e.convexPolyhedronRepresentation,t,n,i,s,o,l,c,e,t,u)}sphereHeightfield(e,t,n,i,s,o,l,c,h,a,u){let d=t.data,f=e.radius,m=t.elementSize,x=Sy,p=My;Qe.pointToLocalFrame(i,o,n,p);let g=Math.floor((p.x-f)/m)-1,_=Math.ceil((p.x+f)/m)+1,y=Math.floor((p.y-f)/m)-1,v=Math.ceil((p.y+f)/m)+1;if(_<0||v<0||g>d.length||y>d[0].length)return;g<0&&(g=0),_<0&&(_=0),y<0&&(y=0),v<0&&(v=0),g>=d.length&&(g=d.length-1),_>=d.length&&(_=d.length-1),v>=d[0].length&&(v=d[0].length-1),y>=d[0].length&&(y=d[0].length-1);let T=[];t.getRectMinMax(g,y,_,v,T);let A=T[0],C=T[1];if(p.z-f>C||p.z+f<A)return;let R=this.result;for(let M=g;M<_;M++)for(let b=y;b<v;b++){let P=R.length,B=!1;if(t.getConvexTrianglePillar(M,b,!1),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(B=this.sphereConvex(e,t.pillarConvex,n,x,s,o,l,c,e,t,u)),u&&B||(t.getConvexTrianglePillar(M,b,!0),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(B=this.sphereConvex(e,t.pillarConvex,n,x,s,o,l,c,e,t,u)),u&&B))return!0;if(R.length-P>2)return}}boxHeightfield(e,t,n,i,s,o,l,c,h,a,u){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexHeightfield(e.convexPolyhedronRepresentation,t,n,i,s,o,l,c,e,t,u)}convexHeightfield(e,t,n,i,s,o,l,c,h,a,u){let d=t.data,f=t.elementSize,m=e.boundingSphereRadius,x=by,p=wy,g=yy;Qe.pointToLocalFrame(i,o,n,g);let _=Math.floor((g.x-m)/f)-1,y=Math.ceil((g.x+m)/f)+1,v=Math.floor((g.y-m)/f)-1,T=Math.ceil((g.y+m)/f)+1;if(y<0||T<0||_>d.length||v>d[0].length)return;_<0&&(_=0),y<0&&(y=0),v<0&&(v=0),T<0&&(T=0),_>=d.length&&(_=d.length-1),y>=d.length&&(y=d.length-1),T>=d[0].length&&(T=d[0].length-1),v>=d[0].length&&(v=d[0].length-1);let A=[];t.getRectMinMax(_,v,y,T,A);let C=A[0],R=A[1];if(!(g.z-m>R||g.z+m<C))for(let M=_;M<y;M++)for(let b=v;b<T;b++){let P=!1;if(t.getConvexTrianglePillar(M,b,!1),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(P=this.convexConvex(e,t.pillarConvex,n,x,s,o,l,c,null,null,u,p,null)),u&&P||(t.getConvexTrianglePillar(M,b,!0),Qe.pointToWorldFrame(i,o,t.pillarOffset,x),n.distanceTo(x)<t.pillarConvex.boundingSphereRadius+e.boundingSphereRadius&&(P=this.convexConvex(e,t.pillarConvex,n,x,s,o,l,c,null,null,u,p,null)),u&&P))return!0}}sphereParticle(e,t,n,i,s,o,l,c,h,a,u){let d=gy;if(d.set(0,0,1),i.vsub(n,d),d.lengthSquared()<=e.radius*e.radius){if(u)return!0;let m=this.createContactEquation(c,l,t,e,h,a);d.normalize(),m.rj.copy(d),m.rj.scale(e.radius,m.rj),m.ni.copy(d),m.ni.negate(m.ni),m.ri.set(0,0,0),this.result.push(m),this.createFrictionEquationsFromContact(m,this.frictionResult)}}planeParticle(e,t,n,i,s,o,l,c,h,a,u){let d=fy;d.set(0,0,1),l.quaternion.vmult(d,d);let f=py;if(i.vsub(l.position,f),d.dot(f)<=0){if(u)return!0;let x=this.createContactEquation(c,l,t,e,h,a);x.ni.copy(d),x.ni.negate(x.ni),x.ri.set(0,0,0);let p=my;d.scale(d.dot(i),p),i.vsub(p,p),x.rj.copy(p),this.result.push(x),this.createFrictionEquationsFromContact(x,this.frictionResult)}}boxParticle(e,t,n,i,s,o,l,c,h,a,u){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexParticle(e.convexPolyhedronRepresentation,t,n,i,s,o,l,c,e,t,u)}convexParticle(e,t,n,i,s,o,l,c,h,a,u){let d=-1,f=_y,m=vy,x=null,p=xy;if(p.copy(i),p.vsub(n,p),s.conjugate(Gd),Gd.vmult(p,p),e.pointIsInside(p)){e.worldVerticesNeedsUpdate&&e.computeWorldVertices(n,s),e.worldFaceNormalsNeedsUpdate&&e.computeWorldFaceNormals(s);for(let g=0,_=e.faces.length;g!==_;g++){let y=[e.worldVertices[e.faces[g][0]]],v=e.worldFaceNormals[g];i.vsub(y[0],Wd);let T=-v.dot(Wd);if(x===null||Math.abs(T)<Math.abs(x)){if(u)return!0;x=T,d=g,f.copy(v)}}if(d!==-1){let g=this.createContactEquation(c,l,t,e,h,a);f.scale(x,m),m.vadd(i,m),m.vsub(n,m),g.rj.copy(m),f.negate(g.ni),g.ri.set(0,0,0);let _=g.ri,y=g.rj;_.vadd(i,_),_.vsub(c.position,_),y.vadd(n,y),y.vsub(l.position,y),this.result.push(g),this.createFrictionEquationsFromContact(g,this.frictionResult)}else console.warn("Point found inside convex, but did not find penetrating face!")}}heightfieldCylinder(e,t,n,i,s,o,l,c,h,a,u){return this.convexHeightfield(t,e,i,n,o,s,c,l,h,a,u)}particleCylinder(e,t,n,i,s,o,l,c,h,a,u){return this.convexParticle(t,e,i,n,o,s,c,l,h,a,u)}sphereTrimesh(e,t,n,i,s,o,l,c,h,a,u){let d=Cv,f=Rv,m=Iv,x=Pv,p=Lv,g=Nv,_=Uv,y=Ev,v=Av,T=zv;Qe.pointToLocalFrame(i,o,n,p);let A=e.radius;_.lowerBound.set(p.x-A,p.y-A,p.z-A),_.upperBound.set(p.x+A,p.y+A,p.z+A),t.getTrianglesInAABB(_,T);let C=Tv,R=e.radius*e.radius;for(let L=0;L<T.length;L++)for(let U=0;U<3;U++)if(t.getVertex(t.indices[T[L]*3+U],C),C.vsub(p,v),v.lengthSquared()<=R){if(y.copy(C),Qe.pointToWorldFrame(i,o,y,C),C.vsub(n,v),u)return!0;let O=this.createContactEquation(l,c,e,t,h,a);O.ni.copy(v),O.ni.normalize(),O.ri.copy(O.ni),O.ri.scale(e.radius,O.ri),O.ri.vadd(n,O.ri),O.ri.vsub(l.position,O.ri),O.rj.copy(C),O.rj.vsub(c.position,O.rj),this.result.push(O),this.createFrictionEquationsFromContact(O,this.frictionResult)}for(let L=0;L<T.length;L++)for(let U=0;U<3;U++){t.getVertex(t.indices[T[L]*3+U],d),t.getVertex(t.indices[T[L]*3+(U+1)%3],f),f.vsub(d,m),p.vsub(f,g);let O=g.dot(m);p.vsub(d,g);let D=g.dot(m);if(D>0&&O<0&&(p.vsub(d,g),x.copy(m),x.normalize(),D=g.dot(x),x.scale(D,g),g.vadd(d,g),g.distanceTo(p)<e.radius)){if(u)return!0;let H=this.createContactEquation(l,c,e,t,h,a);g.vsub(p,H.ni),H.ni.normalize(),H.ni.scale(e.radius,H.ri),H.ri.vadd(n,H.ri),H.ri.vsub(l.position,H.ri),Qe.pointToWorldFrame(i,o,g,g),g.vsub(c.position,H.rj),Qe.vectorToWorldFrame(o,H.ni,H.ni),Qe.vectorToWorldFrame(o,H.ri,H.ri),this.result.push(H),this.createFrictionEquationsFromContact(H,this.frictionResult)}}let M=Dv,b=Fv,P=Bv,B=Sv;for(let L=0,U=T.length;L!==U;L++){t.getTriangleVertices(T[L],M,b,P),t.getNormal(T[L],B),p.vsub(M,g);let O=g.dot(B);if(B.scale(O,g),p.vsub(g,g),O=g.distanceTo(p),dn.pointInTriangle(g,M,b,P)&&O<e.radius){if(u)return!0;let D=this.createContactEquation(l,c,e,t,h,a);g.vsub(p,D.ni),D.ni.normalize(),D.ni.scale(e.radius,D.ri),D.ri.vadd(n,D.ri),D.ri.vsub(l.position,D.ri),Qe.pointToWorldFrame(i,o,g,g),g.vsub(c.position,D.rj),Qe.vectorToWorldFrame(o,D.ni,D.ni),Qe.vectorToWorldFrame(o,D.ri,D.ri),this.result.push(D),this.createFrictionEquationsFromContact(D,this.frictionResult)}}T.length=0}planeTrimesh(e,t,n,i,s,o,l,c,h,a,u){let d=new S,f=bv;f.set(0,0,1),s.vmult(f,f);for(let m=0;m<t.vertices.length/3;m++){t.getVertex(m,d);let x=new S;x.copy(d),Qe.pointToWorldFrame(i,o,x,d);let p=wv;if(d.vsub(n,p),f.dot(p)<=0){if(u)return!0;let _=this.createContactEquation(l,c,e,t,h,a);_.ni.copy(f);let y=Mv;f.scale(p.dot(f),y),d.vsub(y,y),_.ri.copy(y),_.ri.vsub(l.position,_.ri),_.rj.copy(d),_.rj.vsub(c.position,_.rj),this.result.push(_),this.createFrictionEquationsFromContact(_,this.frictionResult)}}}},Wi=new S,Rs=new S,Is=new S,xv=new S,_v=new S,vv=new Wt,yv=new Wt,bv=new S,wv=new S,Mv=new S,Sv=new S,Av=new S;new S;var Tv=new S,Ev=new S,Cv=new S,Rv=new S,Iv=new S,Pv=new S,Lv=new S,Nv=new S,Dv=new S,Fv=new S,Bv=new S,Uv=new nn,zv=[],$a=new S,Hd=new S,Ov=new S,kv=new S,Vv=new S;function Hv(r,e,t){let n=null,i=r.length;for(let s=0;s!==i;s++){let o=r[s],l=Ov;r[(s+1)%i].vsub(o,l);let c=kv;l.cross(e,c);let h=Vv;t.vsub(o,h);let a=c.dot(h);if(n===null||a>0&&n===!0||a<=0&&n===!1){n===null&&(n=a>0);continue}else return!1}return!0}var Za=new S,Gv=new S,Wv=new S,qv=new S,Xv=[new S,new S,new S,new S,new S,new S],Yv=new S,$v=new S,Zv=new S,jv=new S,Kv=new S,Jv=new S,Qv=new S,ey=new S,ty=new S,ny=new S,iy=new S,sy=new S,ry=new S,oy=new S;new S;new S;var ay=new S,ly=new S,cy=new S,hy=new S,uy=new S,dy=new S,fy=new S,py=new S,my=new S,gy=new S,Gd=new Wt,xy=new S;new S;var _y=new S,Wd=new S,vy=new S,yy=new S,by=new S,wy=[0],My=new S,Sy=new S,rl=class{constructor(){this.current=[],this.previous=[]}getKey(e,t){if(t<e){let n=t;t=e,e=n}return e<<16|t}set(e,t){let n=this.getKey(e,t),i=this.current,s=0;for(;n>i[s];)s++;if(n!==i[s]){for(let o=i.length-1;o>=s;o--)i[o+1]=i[o];i[s]=n}}tick(){let e=this.current;this.current=this.previous,this.previous=e,this.current.length=0}getDiff(e,t){let n=this.current,i=this.previous,s=n.length,o=i.length,l=0;for(let c=0;c<s;c++){let h=!1,a=n[c];for(;a>i[l];)l++;h=a===i[l],h||qd(e,a)}l=0;for(let c=0;c<o;c++){let h=!1,a=i[c];for(;a>n[l];)l++;h=n[l]===a,h||qd(t,a)}}};function qd(r,e){r.push((e&4294901760)>>16,e&65535)}var Xc=(r,e)=>r<e?`${r}-${e}`:`${e}-${r}`,ih=class{constructor(){this.data={keys:[]}}get(e,t){let n=Xc(e,t);return this.data[n]}set(e,t,n){let i=Xc(e,t);this.get(e,t)||this.data.keys.push(i),this.data[i]=n}delete(e,t){let n=Xc(e,t),i=this.data.keys.indexOf(n);i!==-1&&this.data.keys.splice(i,1),delete this.data[n]}reset(){let e=this.data,t=e.keys;for(;t.length>0;){let n=t.pop();delete e[n]}}},ol=class extends Ka{constructor(e){e===void 0&&(e={}),super(),this.dt=-1,this.allowSleep=!!e.allowSleep,this.contacts=[],this.frictionEquations=[],this.quatNormalizeSkip=e.quatNormalizeSkip!==void 0?e.quatNormalizeSkip:0,this.quatNormalizeFast=e.quatNormalizeFast!==void 0?e.quatNormalizeFast:!1,this.time=0,this.stepnumber=0,this.default_dt=1/60,this.nextId=0,this.gravity=new S,e.gravity&&this.gravity.copy(e.gravity),e.frictionGravity&&(this.frictionGravity=new S,this.frictionGravity.copy(e.frictionGravity)),this.broadphase=e.broadphase!==void 0?e.broadphase:new Zc,this.bodies=[],this.hasActiveBodies=!1,this.solver=e.solver!==void 0?e.solver:new Qc,this.constraints=[],this.narrowphase=new nh(this),this.collisionMatrix=new ja,this.collisionMatrixPrevious=new ja,this.bodyOverlapKeeper=new rl,this.shapeOverlapKeeper=new rl,this.contactmaterials=[],this.contactMaterialTable=new ih,this.defaultMaterial=new sl("default"),this.defaultContactMaterial=new il(this.defaultMaterial,this.defaultMaterial,{friction:.3,restitution:0}),this.doProfiling=!1,this.profile={solve:0,makeContactConstraints:0,broadphase:0,integrate:0,narrowphase:0},this.accumulator=0,this.subsystems=[],this.addBodyEvent={type:"addBody",body:null},this.removeBodyEvent={type:"removeBody",body:null},this.idToBodyMap={},this.broadphase.setWorld(this)}getContactMaterial(e,t){return this.contactMaterialTable.get(e.id,t.id)}collisionMatrixTick(){let e=this.collisionMatrixPrevious;this.collisionMatrixPrevious=this.collisionMatrix,this.collisionMatrix=e,this.collisionMatrix.reset(),this.bodyOverlapKeeper.tick(),this.shapeOverlapKeeper.tick()}addConstraint(e){this.constraints.push(e)}removeConstraint(e){let t=this.constraints.indexOf(e);t!==-1&&this.constraints.splice(t,1)}rayTest(e,t,n){n instanceof vi?this.raycastClosest(e,t,{skipBackfaces:!0},n):this.raycastAll(e,t,{skipBackfaces:!0},n)}raycastAll(e,t,n,i){return n===void 0&&(n={}),n.mode=dn.ALL,n.from=e,n.to=t,n.callback=i,Yc.intersectWorld(this,n)}raycastAny(e,t,n,i){return n===void 0&&(n={}),n.mode=dn.ANY,n.from=e,n.to=t,n.result=i,Yc.intersectWorld(this,n)}raycastClosest(e,t,n,i){return n===void 0&&(n={}),n.mode=dn.CLOSEST,n.from=e,n.to=t,n.result=i,Yc.intersectWorld(this,n)}addBody(e){this.bodies.includes(e)||(e.index=this.bodies.length,this.bodies.push(e),e.world=this,e.initPosition.copy(e.position),e.initVelocity.copy(e.velocity),e.timeLastSleepy=this.time,e instanceof He&&(e.initAngularVelocity.copy(e.angularVelocity),e.initQuaternion.copy(e.quaternion)),this.collisionMatrix.setNumObjects(this.bodies.length),this.addBodyEvent.body=e,this.idToBodyMap[e.id]=e,this.dispatchEvent(this.addBodyEvent))}removeBody(e){e.world=null;let t=this.bodies.length-1,n=this.bodies,i=n.indexOf(e);if(i!==-1){n.splice(i,1);for(let s=0;s!==n.length;s++)n[s].index=s;this.collisionMatrix.setNumObjects(t),this.removeBodyEvent.body=e,delete this.idToBodyMap[e.id],this.dispatchEvent(this.removeBodyEvent)}}getBodyById(e){return this.idToBodyMap[e]}getShapeById(e){let t=this.bodies;for(let n=0;n<t.length;n++){let i=t[n].shapes;for(let s=0;s<i.length;s++){let o=i[s];if(o.id===e)return o}}return null}addContactMaterial(e){this.contactmaterials.push(e),this.contactMaterialTable.set(e.materials[0].id,e.materials[1].id,e)}removeContactMaterial(e){let t=this.contactmaterials.indexOf(e);t!==-1&&(this.contactmaterials.splice(t,1),this.contactMaterialTable.delete(e.materials[0].id,e.materials[1].id))}fixedStep(e,t){e===void 0&&(e=1/60),t===void 0&&(t=10);let n=St.now()/1e3;if(!this.lastCallTime)this.step(e,void 0,t);else{let i=n-this.lastCallTime;this.step(e,i,t)}this.lastCallTime=n}step(e,t,n){if(n===void 0&&(n=10),t===void 0)this.internalStep(e),this.time+=e;else{this.accumulator+=t;let i=St.now(),s=0;for(;this.accumulator>=e&&s<n&&(this.internalStep(e),this.accumulator-=e,s++,!(St.now()-i>e*1e3)););this.accumulator=this.accumulator%e;let o=this.accumulator/e;for(let l=0;l!==this.bodies.length;l++){let c=this.bodies[l];c.previousPosition.lerp(c.position,o,c.interpolatedPosition),c.previousQuaternion.slerp(c.quaternion,o,c.interpolatedQuaternion),c.previousQuaternion.normalize()}this.time+=t}}internalStep(e){this.dt=e;let t=this.contacts,n=Ry,i=Iy,s=this.bodies.length,o=this.bodies,l=this.solver,c=this.gravity,h=this.doProfiling,a=this.profile,u=He.DYNAMIC,d=-1/0,f=this.constraints,m=Cy;c.length();let x=c.x,p=c.y,g=c.z,_=0;for(h&&(d=St.now()),_=0;_!==s;_++){let L=o[_];if(L.type===u){let U=L.force,O=L.mass;U.x+=O*x,U.y+=O*p,U.z+=O*g}}for(let L=0,U=this.subsystems.length;L!==U;L++)this.subsystems[L].update();h&&(d=St.now()),n.length=0,i.length=0,this.broadphase.collisionPairs(this,n,i),h&&(a.broadphase=St.now()-d);let y=f.length;for(_=0;_!==y;_++){let L=f[_];if(!L.collideConnected)for(let U=n.length-1;U>=0;U-=1)(L.bodyA===n[U]&&L.bodyB===i[U]||L.bodyB===n[U]&&L.bodyA===i[U])&&(n.splice(U,1),i.splice(U,1))}this.collisionMatrixTick(),h&&(d=St.now());let v=Ey,T=t.length;for(_=0;_!==T;_++)v.push(t[_]);t.length=0;let A=this.frictionEquations.length;for(_=0;_!==A;_++)m.push(this.frictionEquations[_]);for(this.frictionEquations.length=0,this.narrowphase.getContacts(n,i,this,t,v,this.frictionEquations,m),h&&(a.narrowphase=St.now()-d),h&&(d=St.now()),_=0;_<this.frictionEquations.length;_++)l.addEquation(this.frictionEquations[_]);let C=t.length;for(let L=0;L!==C;L++){let U=t[L],O=U.bi,D=U.bj,j=U.si,H=U.sj,Z;if(O.material&&D.material?Z=this.getContactMaterial(O.material,D.material)||this.defaultContactMaterial:Z=this.defaultContactMaterial,Z.friction,O.material&&D.material&&(O.material.friction>=0&&D.material.friction>=0&&O.material.friction*D.material.friction,O.material.restitution>=0&&D.material.restitution>=0&&(U.restitution=O.material.restitution*D.material.restitution)),l.addEquation(U),O.allowSleep&&O.type===He.DYNAMIC&&O.sleepState===He.SLEEPING&&D.sleepState===He.AWAKE&&D.type!==He.STATIC){let ae=D.velocity.lengthSquared()+D.angularVelocity.lengthSquared(),de=D.sleepSpeedLimit**2;ae>=de*2&&(O.wakeUpAfterNarrowphase=!0)}if(D.allowSleep&&D.type===He.DYNAMIC&&D.sleepState===He.SLEEPING&&O.sleepState===He.AWAKE&&O.type!==He.STATIC){let ae=O.velocity.lengthSquared()+O.angularVelocity.lengthSquared(),de=O.sleepSpeedLimit**2;ae>=de*2&&(D.wakeUpAfterNarrowphase=!0)}this.collisionMatrix.set(O,D,!0),this.collisionMatrixPrevious.get(O,D)||(Ir.body=D,Ir.contact=U,O.dispatchEvent(Ir),Ir.body=O,D.dispatchEvent(Ir)),this.bodyOverlapKeeper.set(O.id,D.id),this.shapeOverlapKeeper.set(j.id,H.id)}for(this.emitContactEvents(),h&&(a.makeContactConstraints=St.now()-d,d=St.now()),_=0;_!==s;_++){let L=o[_];L.wakeUpAfterNarrowphase&&(L.wakeUp(),L.wakeUpAfterNarrowphase=!1)}for(y=f.length,_=0;_!==y;_++){let L=f[_];L.update();for(let U=0,O=L.equations.length;U!==O;U++){let D=L.equations[U];l.addEquation(D)}}l.solve(e,this),h&&(a.solve=St.now()-d),l.removeAllEquations();let R=Math.pow;for(_=0;_!==s;_++){let L=o[_];if(L.type&u){let U=R(1-L.linearDamping,e),O=L.velocity;O.scale(U,O);let D=L.angularVelocity;if(D){let j=R(1-L.angularDamping,e);D.scale(j,D)}}}this.dispatchEvent(Ty),h&&(d=St.now());let b=this.stepnumber%(this.quatNormalizeSkip+1)===0,P=this.quatNormalizeFast;for(_=0;_!==s;_++)o[_].integrate(e,b,P);this.clearForces(),this.broadphase.dirty=!0,h&&(a.integrate=St.now()-d),this.stepnumber+=1,this.dispatchEvent(Ay);let B=!0;if(this.allowSleep)for(B=!1,_=0;_!==s;_++){let L=o[_];L.sleepTick(this.time),L.sleepState!==He.SLEEPING&&(B=!0)}this.hasActiveBodies=B}emitContactEvents(){let e=this.hasAnyEventListener("beginContact"),t=this.hasAnyEventListener("endContact");if((e||t)&&this.bodyOverlapKeeper.getDiff(Kn,Jn),e){for(let s=0,o=Kn.length;s<o;s+=2)Pr.bodyA=this.getBodyById(Kn[s]),Pr.bodyB=this.getBodyById(Kn[s+1]),this.dispatchEvent(Pr);Pr.bodyA=Pr.bodyB=null}if(t){for(let s=0,o=Jn.length;s<o;s+=2)Lr.bodyA=this.getBodyById(Jn[s]),Lr.bodyB=this.getBodyById(Jn[s+1]),this.dispatchEvent(Lr);Lr.bodyA=Lr.bodyB=null}Kn.length=Jn.length=0;let n=this.hasAnyEventListener("beginShapeContact"),i=this.hasAnyEventListener("endShapeContact");if((n||i)&&this.shapeOverlapKeeper.getDiff(Kn,Jn),n){for(let s=0,o=Kn.length;s<o;s+=2){let l=this.getShapeById(Kn[s]),c=this.getShapeById(Kn[s+1]);Qn.shapeA=l,Qn.shapeB=c,l&&(Qn.bodyA=l.body),c&&(Qn.bodyB=c.body),this.dispatchEvent(Qn)}Qn.bodyA=Qn.bodyB=Qn.shapeA=Qn.shapeB=null}if(i){for(let s=0,o=Jn.length;s<o;s+=2){let l=this.getShapeById(Jn[s]),c=this.getShapeById(Jn[s+1]);ei.shapeA=l,ei.shapeB=c,l&&(ei.bodyA=l.body),c&&(ei.bodyB=c.body),this.dispatchEvent(ei)}ei.bodyA=ei.bodyB=ei.shapeA=ei.shapeB=null}}clearForces(){let e=this.bodies,t=e.length;for(let n=0;n!==t;n++){let i=e[n];i.force,i.torque,i.force.set(0,0,0),i.torque.set(0,0,0)}}};new nn;var Yc=new dn,St=globalThis.performance||{};if(!St.now){let r=Date.now();St.timing&&St.timing.navigationStart&&(r=St.timing.navigationStart),St.now=()=>Date.now()-r}new S;var Ay={type:"postStep"},Ty={type:"preStep"},Ir={type:He.COLLIDE_EVENT_NAME,body:null,contact:null},Ey=[],Cy=[],Ry=[],Iy=[],Kn=[],Jn=[],Pr={type:"beginContact",bodyA:null,bodyB:null},Lr={type:"endContact",bodyA:null,bodyB:null},Qn={type:"beginShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null},ei={type:"endShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null};var Qd=[{id:"relay",name:{sv:"V\xE4xelhuset",en:"The relay yard"},subtitle:{sv:"V\xE4ck verkstaden.",en:"Wake the workshop."},color:"#aebdad",accent:"#234ce7",edge:"#668d83",ground:"#e9e2d1",number:"01",start:[-10,8],exit:[10,-8],cells:[[-10,-7],[1,8],[10,3]],obstacles:[{x:0,z:0,w:5,d:4,type:"turbine"},{x:-8,z:1,w:3,d:2,type:"crate"},{x:7,z:-4,w:3,d:3,type:"tank"},{x:5,z:7,w:2,d:2,type:"crate"}],enemies:[{type:"chaser",x:-9,z:-5},{type:"chaser",x:8,z:4},{type:"shooter",x:8,z:-8},{type:"chaser",x:1,z:7}],scrap:[[-12,3],[-11,-2],[-7,-9],[-3,-8],[3,-8],[10,-2],[12,6],[7,9],[-4,7],[-4,3]],hazards:[],par:95},{id:"coolant",name:{sv:"Kylverket",en:"The cooling works"},subtitle:{sv:"H\xE5ll huvudet kallt.",en:"Keep your cool."},color:"#a7c4bc",accent:"#ec7853",edge:"#4d807c",ground:"#dde8e1",number:"02",start:[-10,8],exit:[10,-8],cells:[[-10,-8],[10,7],[1,-9]],obstacles:[{x:-4,z:2,w:3,d:6,type:"tank"},{x:5,z:-1,w:3,d:6,type:"tank"},{x:-5,z:-7,w:4,d:2,type:"crate"},{x:3,z:7,w:3,d:2,type:"crate"}],enemies:[{type:"charger",x:-10,z:-4},{type:"shooter",x:10,z:1},{type:"charger",x:7,z:8},{type:"chaser",x:-1,z:-7},{type:"shooter",x:5,z:-8}],scrap:[[-12,2],[-12,-5],[-8,-10],[-1,-6],[1,-2],[1,2],[8,6],[12,9],[12,3],[-7,8],[-6,5]],hazards:[{x:0,z:3,w:3,d:.6,period:4.4,offset:0},{x:8,z:-5,w:6,d:.6,period:4.4,offset:2.2}],par:115},{id:"heart",name:{sv:"Maskinhj\xE4rtat",en:"The machine heart"},subtitle:{sv:"Ett sista ryck.",en:"One last spark."},color:"#d5c693",accent:"#cf6e4d",edge:"#8c946e",ground:"#ece2cd",number:"03",start:[-10,8],exit:[10,-8],cells:[[-10,-7],[10,6],[0,8]],obstacles:[{x:-6,z:0,w:2,d:4,type:"crate"},{x:6,z:0,w:2,d:4,type:"crate"},{x:0,z:3,w:3,d:1.4,type:"crate"}],enemies:[{type:"charger",x:-9,z:-4},{type:"shooter",x:10,z:2},{type:"chaser",x:-1,z:7}],scrap:[[-12,2],[-11,-9],[-7,-9],[7,-9],[12,-3],[12,8],[6,9],[-6,9]],hazards:[],boss:[0,-4],par:155}],ah={halfWidth:14,halfDepth:12};var sn={enemy:1,player:2,wall:4},al=class{constructor(e){this.world=new ol({gravity:new S(0,0,0),allowSleep:!0}),this.world.broadphase=new Qa(this.world),this.world.solver.iterations=8,this.world.defaultContactMaterial.friction=0,this.world.defaultContactMaterial.restitution=0,this.walls=[];for(let i of e.obstacles)this.box(i.x,i.z,i.w,i.d);let t=ah.halfWidth,n=ah.halfDepth;this.box(-t-.5,0,1,n*2+2),this.box(t+.5,0,1,n*2+2),this.box(0,-n-.5,t*2+2,1),this.box(0,n+.5,t*2+2,1),this.from=new S,this.to=new S,this.rayResult=new vi}box(e,t,n,i){let s=new He({mass:0,shape:new Nr(new S(n/2,2,i/2)),position:new S(e,0,t),collisionFilterGroup:sn.wall});return this.world.addBody(s),this.walls.push(s),s}actor(e,t,n=.5,i=sn.enemy,s=sn.wall|sn.player){let o=new He({mass:1,shape:new Fr(n),position:new S(e,.6,t),fixedRotation:!0,linearDamping:0,collisionFilterGroup:i,collisionFilterMask:s,allowSleep:!1});return o.linearFactor.set(1,0,1),o.angularFactor.set(0,0,0),this.world.addBody(o),o}post(e,t,n){let i=new He({mass:0,shape:new Fr(n),position:new S(e,.6,t),collisionFilterGroup:sn.enemy,collisionFilterMask:sn.player});return this.world.addBody(i),i}step(e){this.world.step(1/60,Math.min(Math.max(e,0),.05),3)}remove(e){e.world===this.world&&this.world.removeBody(e)}obstructed(e,t,n,i){return this.from.set(e,.6,t),this.to.set(n,.6,i),this.rayResult.reset(),this.world.raycastClosest(this.from,this.to,{collisionFilterMask:4,skipBackfaces:!0},this.rayResult)}};var lh=.52,ef=1.6,tf=8,Br=(r,e)=>Math.hypot(r,e),It=(r,e)=>Math.hypot(r.x-e.x,r.z-e.z),Ly=(r,e,t)=>Math.min(t,Math.max(e,r)),ll=class{constructor(e,t,n){this.view=e,this.sound=t,this.events=n,this.state=ml(),this.load()}newRun(e,t=null){this.state=ml(e,t),this.state.upgrades.includes("shield")&&(this.state.maxHp+=2,this.state.hp=this.state.maxHp),this.load()}load(){this.level=Qd[this.state.sector],this.physics=new al(this.level),this.view.load(this.level),this.player=this.physics.actor(...this.level.start,lh,sn.player,sn.wall|sn.enemy),this.facing=Math.PI,this.moving=!1,this.dashVector={x:0,z:-1},this.knock={x:0,z:0},this.scrap=new Set,this.bullets=[],this.hitDash=new Set,this.elapsed=0,this.enemies=this.level.enemies.map((e,t)=>{let n={...e,body:this.physics.actor(e.x,e.z,e.type==="charger"?.62:.48),hp:e.type==="charger"?5:3,home:{x:e.x,z:e.z},timer:.7+t*.31,telegraph:0,stunned:0,charge:0,dead:!1,seed:t,aim:{x:0,z:0},facing:0};return this.view.addEnemy(n),n}),this.bossState=this.level.boss?{x:this.level.boss[0],z:this.level.boss[1],hp:24,maxHp:24,timer:3,pattern:0,vulnerable:0,waveRadius:0,invulnerable:0,active:!1}:null,this.bossBody=this.bossState&&this.physics.post(this.bossState.x,this.bossState.z,ef),this.checkpoint={difficulty:this.state.difficulty,sector:this.state.sector,score:this.state.score,time:this.state.time,upgrades:[...this.state.upgrades]},this.events("loaded",this.checkpoint)}retry(){this.newRun(this.state.difficulty,this.checkpoint)}advance(e){!this.state.ended||this.state.won||(Eh(this.state,e),Ch(this.state),this.load())}hazardActive(e){let t=this.level.hazards[e];return(this.state.sectorTime+t.offset)%t.period>t.period*.67}hit(e=1){return Sh(this.state,e)?(this.sound.play("hit"),this.view.shake=.22,this.view.wave(this.player.position.x,this.player.position.z,J.coral,1.8,.3),this.events("hit"),this.state.dead&&(this.player.velocity.set(0,0,0),this.knock.x=0,this.knock.z=0,this.sound.play("fail"),this.events("dead")),!0):!1}strike(e,t,n=.35){e.dead||(e.hp-=t,e.stunned=n,e.charge=0,e.telegraph=0,this.view.burst(e.body.position.x,e.body.position.z,J.coral,6),this.sound.play("strike"),e.hp<=0&&(e.dead=!0,this.physics.remove(e.body),this.state.kills++,wi(this.state,e.type==="charger"?400:250),this.view.burst(e.body.position.x,e.body.position.z,J.yellow,12),this.events("kill")))}strikeBoss(e){let t=this.bossState;!t||t.hp<=0||t.vulnerable<=0||t.invulnerable>0||(t.hp=Math.max(0,t.hp-e),t.invulnerable=.32,this.sound.play("strike"),this.view.burst(t.x,t.z,J.yellow,10),this.view.shake=.09,t.hp||(this.state.bossDefeated=!0,this.physics.remove(this.bossBody),this.bullets.length=0,t.waveRadius=0,wi(this.state,2e3),this.sound.play("clear"),this.view.wave(t.x,t.z,J.yellow,9,1.1),this.events("boss")))}shoot(e,t,n,i,s=5,o=!1){if(this.bullets.length>=32)return;let l=Br(n,i)||1;this.bullets.push({x:e,z:t,vx:n/l*s,vz:i/l*s,life:5.5,friendly:o})}discharge(){let e=this.state;if(!Mh(e))return;let t=this.player.position,n=e.upgrades.includes("pulse")?4.1:3.4;this.view.wave(t.x,t.z,J.blue,n,.42),this.view.burst(t.x,t.z,J.paper,5),this.sound.play("pulse"),this.events("pulse");for(let i of this.enemies)if(!i.dead&&It(t,i.body.position)<n&&!this.physics.obstructed(t.x,t.z,i.body.position.x,i.body.position.z)){this.strike(i,2,.65);let s=i.body.position.x-t.x,o=i.body.position.z-t.z,l=Br(s,o)||1;i.body.velocity.set(s/l*5,0,o/l*5)}for(let i of this.bullets)!i.friendly&&It(t,i)<n&&(i.vx*=-1.7,i.vz*=-1.7,i.friendly=!0,i.life=3);this.bossState&&It(t,this.bossState)<n+1.1&&this.strikeBoss(3)}step(e,t){let n=this.state;if(n.dead||n.won||n.ended)return;e=Ly(e,0,.05),bh(n,e),this.elapsed+=e;let i=t.x||0,s=t.y||0,o=Br(i,s);o>1&&(i/=o,s/=o,o=1);let l=(i+s)*Math.SQRT1_2,c=(s-i)*Math.SQRT1_2;if(o>.1&&(this.facing=Math.atan2(l,c)),t.dash&&wh(n)){o<.1&&(l=Math.sin(this.facing),c=Math.cos(this.facing));let d=Br(l,c)||1;this.dashVector={x:l/d,z:c/d},this.hitDash.clear(),this.sound.play("dash"),this.view.wave(this.player.position.x,this.player.position.z,J.paper,1.1,.22),this.events("dash")}t.pulse&&this.discharge();let h=n.dashing>0?24:6.5;this.player.velocity.set((n.dashing>0?this.dashVector.x:l)*h+this.knock.x,0,(n.dashing>0?this.dashVector.z:c)*h+this.knock.z);let a=Math.exp(-e*8);this.knock.x*=a,this.knock.z*=a,this.moving=o>.1||n.dashing>0;let u=this.player.position;for(let d of this.enemies)this.stepEnemy(d,u,e);this.player.collisionFilterMask=n.dashing>0?sn.wall:sn.wall|sn.enemy,this.physics.step(e);for(let d of this.enemies){if(d.dead)continue;let f=It(u,d.body.position);n.dashing>0&&f<1.65&&!this.hitDash.has(d)?(this.hitDash.add(d),this.strike(d,3)):f<lh+d.body.shapes[0].radius+.12&&d.stunned<=0&&this.hit()}for(let d=0;d<this.level.cells.length;d++){let[f,m]=this.level.cells[d];It(u,{x:f,z:m})<1.1&&Ah(n,`cell-${d}`)&&(this.sound.play("cell"),this.view.burst(f,m,J.yellow,18),this.view.wave(f,m,J.blue,2.2),this.events("cell"))}for(let d=0;d<this.level.scrap.length;d++){if(this.scrap.has(d))continue;let[f,m]=this.level.scrap[d];It(u,{x:f,z:m})<.9&&(this.scrap.add(d),n.scrap++,wi(n,65),this.sound.play("scrap"))}for(let d=0;d<this.level.hazards.length;d++){let f=this.level.hazards[d];this.hazardActive(d)&&Math.abs(u.x-f.x)<f.w/2+.25&&Math.abs(u.z-f.z)<f.d/2+.3&&this.hit()}this.stepBoss(e),this.stepBullets(e),It(u,{x:this.level.exit[0],z:this.level.exit[1]})<1.25&&Th(n)&&(this.sound.play("clear"),this.events(n.won?"won":"sector"))}stepEnemy(e,t,n){if(e.dead)return;if(e.stunned=Math.max(0,e.stunned-n),e.stunned>0){e.body.velocity.scale(Math.exp(-n*8),e.body.velocity);return}let i=e.body.position,s=t.x-i.x,o=t.z-i.z,l=Br(s,o)||1;e.facing=Math.atan2(s,o),e.timer-=n;let c=!this.physics.obstructed(i.x,i.z,t.x,t.z),h=this.state.difficulty==="assist"?.85:1;if(e.type==="shooter"){if(e.body.velocity.set(0,0,0),l>13||!c){e.telegraph=0,e.timer=Math.max(.6,e.timer);return}e.timer<.8&&e.telegraph<=0&&(e.telegraph=.8,e.timer=.8,e.aim={x:s/l,z:o/l}),e.telegraph>0&&(e.telegraph=Math.max(.001,e.telegraph-n)),e.timer<=0&&(this.shoot(i.x,i.z,e.aim.x,e.aim.z,5.6*h),this.sound.play("shot"),e.timer=2.6,e.telegraph=0)}else if(e.type==="charger"){if(e.charge>0){e.charge-=n,e.body.velocity.set(e.aim.x*11*h,0,e.aim.z*11*h);return}l<10&&c&&e.timer<=.85?(e.telegraph<=0&&(e.telegraph=.85,e.timer=.85,e.aim={x:s/l,z:o/l}),e.body.velocity.set(0,0,0),e.telegraph=Math.max(.001,e.telegraph-n),e.timer<=0&&(e.charge=.55,e.telegraph=0,e.timer=3.3,this.sound.play("shot"))):(e.telegraph=0,l>1.5?this.seek(e,s/l,o/l,2*h,c):e.body.velocity.set(0,0,0))}else l<12?this.seek(e,s/l,o/l,2.5*h,c):e.body.velocity.set(0,0,0)}seek(e,t,n,i,s){if(!s){let o=e.body.position,l=e.seed%2?1:-1,c=[[t,n],[-n*l,t*l],[n*l,-t*l]];for(let[h,a]of c)if(!this.physics.obstructed(o.x,o.z,o.x+h*1.7,o.z+a*1.7)){t=h,n=a;break}}e.body.velocity.set(t*i,0,n*i)}stepBoss(e){let t=this.bossState,n=this.state;if(!t||n.bossDefeated)return;let i=this.player.position;if(t.active=n.cells.size>=2||It(i,t)<7,!!t.active){if(t.invulnerable=Math.max(0,t.invulnerable-e),t.vulnerable=Math.max(0,t.vulnerable-e),t.timer-=e,t.waveRadius>0&&(t.waveRadius+=e*4.7,Math.abs(It(i,t)-t.waveRadius)<.55&&this.hit(),t.waveRadius>21&&(t.waveRadius=0)),n.dashing>0&&It(i,t)<2.3&&this.strikeBoss(3),It(i,t)<ef+lh+.12&&t.vulnerable<=0&&this.hit()&&!n.dead){let s=It(i,t)||1;this.knock.x=(i.x-t.x)/s*tf,this.knock.z=(i.z-t.z)/s*tf}if(t.timer<=0){let s=n.difficulty==="assist"?.8:1;if(t.pattern%3===0)for(let o=0;o<12;o++){let l=o*Math.PI/6;this.shoot(t.x,t.z,Math.sin(l),Math.cos(l),4.4*s)}else if(t.pattern%3===1)t.waveRadius=1;else{let o=Math.atan2(i.z-t.z,i.x-t.x);for(let l=-2;l<=2;l++)this.shoot(t.x,t.z,Math.cos(o+l*.18),Math.sin(o+l*.18),6.4*s)}t.pattern++,t.timer=t.hp<=12?4.4:5.1,t.vulnerable=3.1,this.sound.play("boss"),this.view.wave(t.x,t.z,J.coral,2,.6)}}}stepBullets(e){let t=this.player.position;for(let n=this.bullets.length-1;n>=0;n--){let i=this.bullets[n],s=i.x+i.vx*e,o=i.z+i.vz*e;if(i.life-=e,i.life<=0||this.physics.obstructed(i.x,i.z,s,o)){this.bullets.splice(n,1);continue}if(i.x=s,i.z=o,i.friendly){let l=!1;for(let c of this.enemies)if(!c.dead&&It(i,c.body.position)<.75){this.strike(c,3),l=!0;break}this.bossState&&It(i,this.bossState)<1.7&&!this.state.bossDefeated&&(this.strikeBoss(2),l=!0),l&&this.bullets.splice(n,1)}else It(i,t)<.7&&(this.state.dashing>0?(i.vx*=-1.6,i.vz*=-1.6,i.friendly=!0,wi(this.state,40)):(this.hit(),this.bullets.splice(n,1)))}}objective(){let e=this.player.position,t=this.level.cells.map(([n,i],s)=>({x:n,z:i,id:s,kind:"cell"})).filter(n=>!this.state.cells.has(`cell-${n.id}`));return t.length?t.sort((n,i)=>It(n,e)-It(i,e))[0]:this.bossState&&!this.state.bossDefeated?{...this.bossState,kind:"boss"}:{x:this.level.exit[0],z:this.level.exit[1],kind:"exit"}}snapshot(){let e=this.state,t=this.player.position;return{sector:e.sector,hp:e.hp,maxHp:e.maxHp,cells:[...e.cells],score:e.score,time:e.time,dead:e.dead,won:e.won,player:{x:t.x,z:t.z},dashCooldown:e.dashCooldown,pulseCooldown:e.pulseCooldown,enemies:this.enemies.map(n=>({x:n.body.position.x,z:n.body.position.z,hp:n.hp,dead:n.dead,type:n.type})),boss:this.bossState?{hp:this.bossState.hp,vulnerable:this.bossState.vulnerable,wave:this.bossState.waveRadius}:null,bullets:this.bullets.length,bodies:this.physics.world.bodies.length,objective:this.objective()}}};var cl=class{constructor(e,t){this.enabled=!1,this.keys=new Set,this.stick={x:0,y:0,id:null},this.held={dash:!1,pulse:!1},this.taps={dash:!1,pulse:!1},this.canvas=e,window.addEventListener("keydown",h=>{if(h.code==="Escape"&&this.enabled){h.preventDefault(),t();return}!this.enabled||h.target.closest?.("input,select,button")||["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","ShiftLeft","ShiftRight","KeyW","KeyA","KeyS","KeyD","KeyJ","KeyK","KeyE"].includes(h.code)&&(h.preventDefault(),this.keys.add(h.code),!h.repeat&&["Space","ShiftLeft","ShiftRight"].includes(h.code)&&(this.taps.dash=!0),!h.repeat&&["KeyJ","KeyK","KeyE"].includes(h.code)&&(this.taps.pulse=!0))}),window.addEventListener("keyup",h=>this.keys.delete(h.code)),window.addEventListener("blur",()=>this.clear()),e.addEventListener("contextmenu",h=>h.preventDefault());let n=h=>{if(!(!this.enabled||h.pointerType!=="mouse"))for(let[a,u]of[["pulse",1],["dash",2]]){let d=!!(h.buttons&u);d&&!this.held[a]&&(this.taps[a]=!0),this.held[a]=d}};e.addEventListener("pointerdown",h=>{!this.enabled||h.pointerType!=="mouse"||(h.preventDefault(),e.setPointerCapture(h.pointerId),n(h))}),e.addEventListener("pointermove",n);let i=()=>{this.held.dash=!1,this.held.pulse=!1};e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("lostpointercapture",i);for(let h of["dash","pulse"]){let a=document.getElementById(`${h}-control`);a.addEventListener("pointerdown",d=>{this.enabled&&(d.preventDefault(),a.setPointerCapture(d.pointerId),this.held[h]=!0,this.taps[h]=!0)});let u=()=>{this.held[h]=!1};for(let d of["pointerup","pointercancel","lostpointercapture"])a.addEventListener(d,u);a.addEventListener("click",d=>{d.detail===0&&this.enabled&&(this.taps[h]=!0)})}let s=document.getElementById("joystick"),o=s.querySelector("i");this.nub=o;let l=h=>{if(this.stick.id!==h.pointerId)return;let a=s.getBoundingClientRect(),u=h.clientX-a.left-a.width/2,d=h.clientY-a.top-a.height/2,f=Math.hypot(u,d),m=42;this.stick.x=u/Math.max(m,f),this.stick.y=d/Math.max(m,f),o.style.transform=`translate(${this.stick.x*m}px,${this.stick.y*m}px)`};s.addEventListener("pointerdown",h=>{!this.enabled||this.stick.id!==null||(h.preventDefault(),this.stick.id=h.pointerId,s.setPointerCapture(h.pointerId),l(h))}),s.addEventListener("pointermove",l);let c=h=>{this.stick.id===h.pointerId&&(this.stick={x:0,y:0,id:null},o.style.transform="")};for(let h of["pointerup","pointercancel","lostpointercapture"])s.addEventListener(h,c)}clear(){this.keys.clear(),this.stick={x:0,y:0,id:null},this.held={dash:!1,pulse:!1},this.taps={dash:!1,pulse:!1},this.nub&&(this.nub.style.transform="")}read(){if(!this.enabled)return{x:0,y:0,dash:!1,pulse:!1};let e=this.keys,t={x:Number(e.has("KeyD")||e.has("ArrowRight"))-Number(e.has("KeyA")||e.has("ArrowLeft"))+this.stick.x,y:Number(e.has("KeyS")||e.has("ArrowDown"))-Number(e.has("KeyW")||e.has("ArrowUp"))+this.stick.y,dash:e.has("Space")||e.has("ShiftLeft")||e.has("ShiftRight")||this.held.dash||this.taps.dash,pulse:e.has("KeyJ")||e.has("KeyK")||e.has("KeyE")||this.held.pulse||this.taps.pulse};return this.taps.dash=!1,this.taps.pulse=!1,t}};var Ps=bf(nf(),1),ul=class{constructor(e){this.settings=e,this.ready=!1,this.fx={},this.active=!1}ensure(){if(this.ready){Ps.Howler.ctx?.resume().catch(()=>{});return}this.ready=!0;let e=new URL("/play/skift/audio/",document.baseURI).href;for(let t of["dash","pulse","hit","strike","scrap","cell","shot","clear","fail","boss"])this.fx[t]=new Ps.Howl({src:[`${e}${t}.wav`],volume:t==="shot"?.13:.3,preload:!0});this.music=new Ps.Howl({src:[`${e}shift.mp3`],loop:!0,volume:.17,preload:!0}),this.apply()}apply(){this.ready&&(Ps.Howler.mute(!this.settings.sound),this.active&&this.settings.sound&&this.settings.music?this.music.playing()||this.music.play():this.music.pause())}play(e){if(!this.ready||!this.settings.sound)return;let t=this.fx[e];t&&(!t.playing()||e==="dash")&&t.play()}start(){this.ensure(),this.active=!0,this.apply()}pause(){this.active=!1,this.ready&&(this.music.pause(),Object.values(this.fx).forEach(e=>e.stop()))}};var sf={sv:{workshop:"ETT SPEL FR\xC5N VERKSTADEN",portfolio:"Till portfolion",how:"S\xE5 spelar du",settings:"Inst\xE4llningar",line1:"Sista skiftet.",line2:"Full fart.",intro:"En liten robot. En stor kortslutning. V\xE4xla upp, sl\xE5 tillbaka och f\xE5 verkstaden att leva igen.",start:"Starta skiftet",resumeRun:"Forts\xE4tt skiftet",newRun:"B\xF6rja fr\xE5n b\xF6rjan",subtitle:"ETT MEKANISKT ACTION\xC4VENTYR",noInstall:"Tre distrikt. Ett maskinhj\xE4rta. Bara du.",saving:"Framsteg sparas p\xE5 den h\xE4r enheten.",loading:"Bygger upp verkstaden",ready:"VERKSTADEN \xC4R \xD6PPEN",sector:"DISTRIKT",cells:"ENERGICELLER",score:"PO\xC4NG",hull:"SKROV",collect:"Samla tre energiceller.",exit:"Porten \xE4r \xF6ppen. Ta dig ut!",bossGoal:"Kyl regulatorn. Sl\xE5 n\xE4r k\xE4rnan \xE4r gul.",dash:"DASH",pulse:"PULS",pause:"Pausa",move:"R\xD6R DIG",back:"Tillbaka",close:"St\xE4ng",continue:"Forts\xE4tt",paused:"Ta en andningspaus.",pausedText:"Verkstaden v\xE4ntar. Inget r\xF6r sig f\xF6rr\xE4n du \xE4r tillbaka.",resume:"Tillbaka till skiftet",toMenu:"Till startsk\xE4rmen",howTitle:"Liten robot. Stora m\xF6jligheter.",howText:"\xC5terst\xE4ll str\xF6mmen i tre distrikt. Samla de bl\xE5 energicellerna och n\xE5 den m\xE4rkta porten.",moveText:"WASD eller piltangenter. P\xE5 touchsk\xE4rm: styrspaken till v\xE4nster.",dashText:"Mellanslag / Shift eller h\xF6gerklick. Rusa genom fiender och projektiler. Under dashen \xE4r du os\xE5rbar.",pulseText:"J / E eller v\xE4nsterklick. Knuffa tillbaka fiender och skicka deras skott i retur. H\xE5ll inne f\xF6r att anv\xE4nda igen n\xE4r pulsen laddats.",readText:"Orange markeringar varnar f\xF6r attacker. Gula k\xE4rnor \xE4r s\xE5rbara. Energiceller reparerar ett skrovsteg.",scoreText:"Kedja skrot och besegrade vakter f\xF6r h\xF6gre po\xE4ng. Snabba, oskadda distrikt ger bonus. En uppgradering v\xE4ntar mellan distrikten.",bossText:"Regulatorn \xF6ppnar sin gula k\xE4rna efter varje attack. Sl\xE5 med dash eller puls. Dasha genom de ut\xE5tg\xE5ende chockv\xE5gorna.",sound:"Ljud",music:"Musik",motion:"Extra r\xF6relser och effekter",language:"Spr\xE5k",quality:"Bildfrekvens",eco:"30 FPS \xB7 energisn\xE5l",smooth:"60 FPS \xB7 h\xF6gre effektbehov",difficulty:"Sv\xE5righetsgrad",normal:"Standard",assist:"Assist \xB7 mer skrov, l\xE5ngsammare fiender",difficultyNote:"Sv\xE5righetsgraden g\xE4ller n\xE4sta nya skift.",storageNote:"Endast lokala framsteg och inst\xE4llningar. Inga konton, ingen sp\xE5rning.",sectorDone:"Ett distrikt vaknar.",upgradePrompt:"Ta en uppgradering till n\xE4sta skift.",choose:"V\xC4LJ UPPGRADERING",dashName:"Snabbv\xE4xel",dashDesc:"Kortare v\xE4ntan mellan dashar. H\xE5ll dig i r\xF6relse.",pulseName:"St\xF6rre urladdning",pulseDesc:"St\xF6rre pulsradie och snabbare \xE5terladdning.",shieldName:"Reservpl\xE5t",shieldDesc:"Tv\xE5 extra skrovsteg. Hela skrovet repareras.",dead:"Ett litet driftstopp.",deadText:"Du b\xF6rjar om i samma distrikt. Dina tidigare distriktsframsteg \xE4r kvar.",retry:"F\xF6rs\xF6k igen",won:"Verkstaden lever.",wonText:"Tre distrikt. Ett \xE5terst\xE4llt maskinhj\xE4rta. Du kan ta rast nu. Eller ett skift till.",again:"Ett skift till",total:"SLUTPO\xC4NG",best:"DITT B\xC4STA",time:"TID",rank:"OMD\xD6ME",newBest:"NYTT PERSONB\xC4STA",cellFound:"Energicell \xE5terfunnen. Ett skrovsteg reparerat.",kill:"Vakt urkopplad.",bossDown:"Regulatorn \xE4r avst\xE4ngd. Porten \xE4r \xF6ppen.",startupError:"Ett ov\xE4ntat fel uppstod n\xE4r spelet laddades. Ladda om sidan. Dina sparade framsteg finns kvar.",tutorialTouchMove:"Styr med spaken till v\xE4nster. F\xF6lj den bl\xE5 mark\xF6ren till energicellerna.",tutorialTouchDash:"Tryck DASH f\xF6r att rusa genom faran. PULS sl\xE5r tillbaka och reflekterar skott.",tutorialMove:"R\xF6r dig med WASD eller pilarna. F\xF6lj den bl\xE5 mark\xF6ren till energicellerna.",tutorialDash:"Mellanslag: dasha genom faran. J: sl\xE5 tillbaka med en puls.",tutorialCell:"En energicell reparerar ett skrovsteg. Samla alla tre och g\xE5 till porten.",fault:"Verkstaden kunde inte starta.",faultText:"Spelet beh\xF6ver WebGL 2 i en vanlig, uppdaterad webbl\xE4sare. Kontrollera att h\xE5rdvaruacceleration \xE4r tillg\xE4nglig och ladda om.",reload:"Ladda om",contextLost:"Grafiken pausades av webbl\xE4saren. Ladda om f\xF6r att \xE5terg\xE5 till senaste distriktscheckpoint.",noStorage:"Webbl\xE4saren till\xE5ter inte sparning. Du kan spela, men framstegen f\xF6rsvinner n\xE4r sidan st\xE4ngs.",touch:"TOUCH",checkpoint:"Checkpoint: distrikt",counter:"AV 3",available:"Redo",footer:"TEKNIK MED HJ\xC4RNA. LITE BUS I SYSTEMET."},en:{workshop:"A GAME FROM THE WORKSHOP",portfolio:"Back to portfolio",how:"How to play",settings:"Settings",line1:"Last shift.",line2:"Full tilt.",intro:"One small robot. One enormous short circuit. Shift up, strike back and bring the workshop to life.",start:"Start your shift",resumeRun:"Continue your shift",newRun:"Start from the beginning",subtitle:"A MECHANICAL ACTION ADVENTURE",noInstall:"Three districts. One machine heart. Just you.",saving:"Progress stays on this device.",loading:"Waking up the workshop",ready:"THE WORKSHOP IS OPEN",sector:"DISTRICT",cells:"ENERGY CELLS",score:"SCORE",hull:"HULL",collect:"Recover three energy cells.",exit:"The gate is open. Get to it!",bossGoal:"Cool the regulator. Strike the yellow core.",dash:"DASH",pulse:"PULSE",pause:"Pause",move:"MOVE",back:"Back",close:"Close",continue:"Continue",paused:"Take a breath.",pausedText:"The workshop can wait. Nothing moves until you are ready.",resume:"Back to your shift",toMenu:"Back to the title",howTitle:"Small robot. Big possibilities.",howText:"Restore power in three districts. Collect the blue energy cells and reach the marked gate.",moveText:"WASD or arrow keys. On a touchscreen, use the stick on the left.",dashText:"Space / Shift or right-click. Rush through enemies and shots. You are invulnerable during a dash.",pulseText:"J / E or left-click. Knock back enemies and return their shots. Hold to use again when the pulse recharges.",readText:"Orange marks warn of attacks. Yellow cores are vulnerable. Every energy cell repairs one hull segment.",scoreText:"Chain scrap and defeated sentries for a higher score. Fast, undamaged districts earn bonuses. Choose an upgrade between districts.",bossText:"The regulator exposes its yellow core after each attack. Hit it with a dash or pulse. Dash through outward-moving shockwaves.",sound:"Sound",music:"Music",motion:"Extra motion and effects",language:"Language",quality:"Frame rate",eco:"30 FPS \xB7 energy saving",smooth:"60 FPS \xB7 higher power demand",difficulty:"Difficulty",normal:"Standard",assist:"Assist \xB7 more hull, slower enemies",difficultyNote:"Difficulty applies to the next new shift.",storageNote:"Only local progress and preferences. No account. No tracking.",sectorDone:"A district wakes up.",upgradePrompt:"Take one upgrade into your next shift.",choose:"CHOOSE AN UPGRADE",dashName:"Quickshift",dashDesc:"Less time between dashes. Keep moving.",pulseName:"Overcharge",pulseDesc:"A wider pulse with a shorter recharge.",shieldName:"Spare plating",shieldDesc:"Two extra hull segments. Fully repaired.",dead:"A minor breakdown.",deadText:"Restart this district. Your previous district progress is safe.",retry:"Try again",won:"The workshop lives.",wonText:"Three districts. One restored machine heart. Take a break. Or take another shift.",again:"One more shift",total:"FINAL SCORE",best:"PERSONAL BEST",time:"TIME",rank:"RANK",newBest:"NEW PERSONAL BEST",cellFound:"Energy cell recovered. One hull segment repaired.",kill:"Sentry disconnected.",bossDown:"Regulator shut down. The gate is open.",startupError:"An unexpected error occurred while loading the game. Reload the page. Your saved progress is kept.",tutorialTouchMove:"Move with the left stick. Follow the blue marker to the energy cells.",tutorialTouchDash:"Tap DASH to rush through danger. PULSE strikes back and reflects shots.",tutorialMove:"Move with WASD or the arrows. Follow the blue marker to the energy cells.",tutorialDash:"Space: dash through danger. J: strike back with a pulse.",tutorialCell:"Energy cells repair one hull segment. Collect all three, then find the gate.",fault:"The workshop could not start.",faultText:"This game needs WebGL 2 in an up-to-date browser. Check that hardware acceleration is available and reload.",reload:"Reload",contextLost:"The browser paused graphics. Reload to return to your last district checkpoint.",noStorage:"This browser is blocking local saves. You can play, but progress will be lost when this page closes.",touch:"TOUCH",checkpoint:"Checkpoint: district",counter:"OF 3",available:"Ready",footer:"ENGINEERED WITH CARE. A LITTLE MISCHIEF INCLUDED."}};var dl=class{constructor(e,t,n,i){this.touchQuery=matchMedia("(pointer:coarse)"),this.settings=e,this.save=t,this.onAction=n,this.onSetting=i,this.modal=document.getElementById("modal"),this.kind=null,this.game=null,this.didDash=!1,this.didPulse=!1,this.nodes=Object.fromEntries(["title-screen","game-screen","start-button","new-button","sector-number","sector-title","objective-text","cell-count","cell-icons","health","score","clock","dash-control","pulse-control","dash-ready","pulse-ready","waypoint","waypoint-label","combo","combo-number","tutorial","boss-hud","boss-health","boss-state"].map(s=>[s,document.getElementById(s)])),document.addEventListener("click",s=>{let o=s.target.closest("[data-action]");o&&!o.disabled&&n(o.dataset.action,o.dataset.value)}),this.modal.addEventListener("change",s=>{let o=s.target.dataset.setting;o&&i(o,s.target.type==="checkbox"?s.target.checked:s.target.value)}),this.modal.addEventListener("cancel",s=>{s.preventDefault(),n("close")}),this.translate()}t(e){return (["workshop","line1","line2","intro","start","resumeRun","newRun","noInstall","saving","loading","ready","footer"].includes(e)?globalThis.__OY_SKIFT_COPY__?.["runtime.skift."+this.settings.language+"."+e]:undefined)??(sf[this.settings.language][e]||e)}translate(){document.documentElement.lang=this.settings.language,document.querySelectorAll("[data-t]").forEach(n=>n.textContent=this.t(n.dataset.t)),document.getElementById("language-button").textContent=this.settings.language==="sv"?"SV / EN":"EN / SV",document.getElementById("pause-button").setAttribute("aria-label",this.t("pause"));let e=this.settings.language==="sv",t=e?"Spelv\xE4rld":"Game world";document.getElementById("world").setAttribute("aria-label",t),document.querySelector("#world canvas")?.setAttribute("aria-label","SKIFT \u2014 "+t),document.querySelector("[data-skift-menu]").setAttribute("aria-label",e?"Spelmeny":"Game menu"),document.getElementById("joystick").setAttribute("aria-label",e?"Styrspak":"Movement joystick"),this.nodes["pulse-control"].setAttribute("aria-label",e?"Puls":"Pulse"),document.getElementById("language-button").setAttribute("aria-label",e?"Byt till engelska":"Switch to Swedish"),this.nodes.health.setAttribute("aria-label",this.t("hull")),this.updateTitle(),this.isReady&&(document.getElementById("load-status").textContent=this.t("ready"))}updateTitle(){let e=!!this.save.checkpoint;this.nodes["start-button"].querySelector("[data-t]").textContent=this.t(e?"resumeRun":"start"),this.nodes["new-button"].hidden=!e}ready(){this.isReady=!0,this.nodes["start-button"].disabled=!1,document.getElementById("load-status").textContent=this.t("ready"),this.translate()}mode(e){let t=e==="menu";this.nodes["title-screen"].hidden=!t,this.nodes["game-screen"].hidden=t,document.body.dataset.mode=e}announce(e){document.getElementById("announcer").textContent=e}wp(e,t){let n=e.objective(),i=t.project(n.x,n.z,1.4),s=this.nodes;s.waypoint.style.left=`${Math.round(Math.max(25,Math.min(t.width-25,i.x)))}px`,s.waypoint.style.top=`${Math.round(Math.max(170,Math.min(t.height-145,i.y)))}px`}toast(e){let t=document.getElementById("toast");t.textContent=e,t.hidden=!1,clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{t.hidden=!0},5e3)}close(){this.modal.open&&this.modal.close(),this.kind=null}open(e,t=this.game,n=""){this.kind=e,this.game=t;let i=d=>this.t(d),s=t?.state,o="",l="",c="",h="",a="SKIFT / POWER WORKS",u=["how","settings","pause"].includes(e);if(e==="pause"&&(o=i("paused"),l=i("pausedText"),h=`<button class="primary" data-action="resume">${i("resume")} \u2197</button><button class="secondary" data-action="settings">${i("settings")}</button><button class="text-button" data-action="menu">${i("toMenu")}</button>`),e==="how"&&(o=i("howTitle"),l=i("howText"),c=[["WASD","moveText"],["\u2197","dashText"],["\u25CE","pulseText"],["!","readText"],["\xD7","scoreText"],["03","bossText"]].map(([d,f])=>`<div class="how-row"><b>${d}</b><p>${i(f)}</p></div>`).join(""),h=`<button class="primary" data-action="close">${i("back")} \u2197</button>`),e==="settings"){o=i("settings");let d=(m,x,p)=>`<label class="setting-row"><span>${i(x)}</span><select data-setting="${m}">${p.map(([g,_])=>`<option value="${g}" ${this.settings[m]===g?"selected":""}>${_}</option>`).join("")}</select></label>`,f=(m,x)=>`<label class="setting-row"><span>${i(x)}</span><input type="checkbox" data-setting="${m}" ${this.settings[m]?"checked":""}></label>`;c=d("language","language",[["sv","Svenska"],["en","English"]])+d("quality","quality",[["eco",i("eco")],["smooth",i("smooth")]])+f("sound","sound")+f("music","music")+f("motion","motion")+d("difficulty","difficulty",[["normal",i("normal")],["assist",i("assist")]])+`<p class="setting-note">${i("difficultyNote")}</p><p class="setting-note">${i("storageNote")}</p>`,h=`<button class="primary" data-action="close">${i("back")} \u2197</button>`}e==="sector"&&(o=i("sectorDone"),l=i("upgradePrompt"),a=`${i("sector")} ${String(s.sector+1).padStart(2,"0")} / ${i("choose")}`,c=`<div class="upgrade-grid">${["dash","pulse","shield"].filter(d=>!s.upgrades.includes(d)).map(d=>`<button class="upgrade" data-action="upgrade" data-value="${d}"><span class="upgrade-icon">${d==="dash"?"\u2197":d==="pulse"?"\u25CE":"\u25A4"}</span><span><h3>${i(d+"Name")}</h3><p>${i(d+"Desc")}</p></span><span class="upgrade-arrow">\u2192</span></button>`).join("")}</div>`),e==="dead"&&(o=i("dead"),l=i("deadText"),c=`<div class="result-stats"><div><span>${i("sector")}</span><strong>0${s.sector+1}</strong></div><div><span>${i("score")}</span><strong>${s.score.toLocaleString(this.settings.language)}</strong></div></div>`,h=`<button class="primary" data-action="retry">${i("retry")} \u2197</button><button class="secondary" data-action="menu">${i("toMenu")}</button>`),e==="won"&&(o=i("won"),l=i("wonText"),a=`SKIFT / ${i("rank")} ${Hr(s.score)}`,c=`<div class="rank-stamp" aria-label="${i("rank")} ${Hr(s.score)}">${Hr(s.score)}</div><div class="result-stats"><div><span>${i("total")}</span><strong>${s.score.toLocaleString(this.settings.language)}</strong></div><div><span>${i("time")}</span><strong>${_l(s.time)}</strong></div><div><span>${i("best")}</span><strong>${this.save.best.toLocaleString(this.settings.language)}</strong></div><div><span>${i("difficulty")}</span><strong>${s.difficulty==="assist"?"Assist":i("normal")}</strong></div></div>${s.score>=this.save.best?`<span class="new-best">${i("newBest")}</span>`:""}`,h=`<button class="primary" data-action="new">${i("again")} \u2197</button><button class="secondary" data-action="menu">${i("toMenu")}</button>`),e==="error"&&(o=i("fault"),l=n||i("faultText"),h=`<button class="primary" data-action="reload">${i("reload")} \u2197</button>`),this.modal.innerHTML=`<div class="modal-inner">${u?`<button class="modal-close" data-action="close" aria-label="${i("close")}">\xD7</button>`:""}<p class="eyebrow">${a}</p><h2 id="modal-title">${o}</h2>${l?`<p>${l}</p>`:""}${c}${h?`<div class="modal-actions">${h}</div>`:""}</div>`,this.modal.open||this.modal.showModal(),(this.modal.querySelector(".primary,.upgrade")||this.modal.querySelector("select,button"))?.focus({preventScroll:!0})}hud(e,t){this.game=e;let n=e.state,i=this.nodes;i["sector-number"].textContent=`0${n.sector+1} / 03`,i["sector-title"].textContent=e.level.name[this.settings.language],i["objective-text"].textContent=this.t(n.cells.size<3?"collect":e.bossState&&!n.bossDefeated?"bossGoal":"exit"),i["cell-count"].textContent=`${n.cells.size} / 3`,[...i["cell-icons"].children].forEach((o,l)=>o.classList.toggle("on",n.cells.has(`cell-${l}`))),[...i.health.children].forEach((o,l)=>{o.hidden=l>=n.maxHp,o.classList.toggle("empty",l>=n.hp)}),i.health.setAttribute("aria-valuenow",String(n.hp)),i.health.setAttribute("aria-valuemax",String(n.maxHp)),i.score.textContent=String(n.score).padStart(5,"0"),i.clock.textContent=_l(n.time);for(let[o,l,c]of[["dash",n.dashCooldown,gl(n)],["pulse",n.pulseCooldown,xl(n)]])i[`${o}-control`].style.setProperty("--cooldown",`${Math.min(100,l/c*100)}%`),i[`${o}-ready`].textContent=l>0?`${l.toFixed(1)}s`:this.t("available");i.combo.hidden=n.combo<2,i["combo-number"].textContent=`\xD7${(1+(n.combo-1)*.2).toFixed(1)}`;let s=e.objective();i["waypoint-label"].textContent=s.kind==="cell"?`${s.id+1}`:s.kind==="boss"?"!":"\u2192",i["boss-hud"].hidden=!e.bossState?.active||n.bossDefeated,e.bossState&&(i["boss-health"].style.width=`${e.bossState.hp/e.bossState.maxHp*100}%`,i["boss-state"].textContent=e.bossState.vulnerable>0?this.settings.language==="sv"?"K\xC4RNAN \xC4R \xD6PPEN":"CORE EXPOSED":""),i.tutorial.textContent=n.sector===0&&n.sectorTime<32?this.t(n.cells.size>0?"tutorialCell":n.sectorTime>10?this.touchQuery.matches?"tutorialTouchDash":"tutorialDash":this.touchQuery.matches?"tutorialTouchMove":"tutorialMove"):""}};var zr;try{zr=window.localStorage}catch{zr=null}var hh=matchMedia("(pointer:coarse)").matches,Zt=Rh(zr,hh),jt=Zt.settings;zr||Object.assign(Zt,Yi(null,hh));matchMedia("(prefers-reduced-motion: reduce)").matches&&(jt.motion=!1);var yt="menu",Ct,Pt,Tn,An,Or=!1,Ns=0,Ds=0,uh=performance.now(),ch=0,rf="menu",qe,fn={frames:0,steps:0,cost:[],maxCost:0},Fs=()=>{let r=Ih(zr,Zt);return!r&&Or&&!Fs.warned&&(Fs.warned=!0,qe.toast(qe.t("noStorage"))),r};qe=new dl(jt,Zt,Dy,af);function Bn(){!Ns&&!document.hidden&&(Ns=requestAnimationFrame(Ny))}function Ny(r){if(Ns=0,!Or||document.hidden)return;let e=1e3/(jt.quality==="smooth"?60:30);if(r-Ds<e-.7){Bn();return}let t=Math.min(.05,Math.max(0,(r-Ds)/1e3));Ds=r;let n=performance.now();yt==="play"&&(Ct.step(t,Tn.read()),fn.steps++),Pt.draw(Ct,yt,yt==="play"||yt==="menu"?t:0,r/1e3),yt!=="menu"&&(qe.wp(Ct,Pt),r-ch>90&&(qe.hud(Ct,Pt),ch=r));let i=performance.now()-n;fn.frames++,fn.maxCost=Math.max(fn.maxCost,i),fn.cost.push(i),fn.cost.length>600&&fn.cost.shift(),(yt==="play"||yt==="menu"&&r-uh<1e4)&&Bn()}function Ur(){yt="play",Tn.enabled=!0,Tn.clear(),qe.close(),qe.mode(yt),An.start(),Ds=performance.now(),ch=0,Pt.renderer.domElement.focus({preventScroll:!0}),Bn()}function Ls(){yt==="play"&&(yt="pause",Tn.enabled=!1,Tn.clear(),An.pause(),qe.open("pause",Ct),Bn())}function of(r=null){qe.close(),yt="play",Ct.newRun(jt.difficulty,r),qe.didDash=!1,qe.didPulse=!1,Ur()}function Dy(r,e){if(r==="reload"){location.reload();return}if(r==="language"){af("language",jt.language==="sv"?"en":"sv");return}if(r==="how"||r==="settings"){yt==="play"&&Ls(),rf=yt==="menu"?"menu":"pause",qe.open(r,Ct);return}if(Or||r==="close")if(r==="start")of(Zt.checkpoint);else if(r==="new")of();else if(r==="pause")Ls();else if(r==="resume")Ur();else if(r==="close"){if(!["pause","settings","how"].includes(qe.kind))return;qe.kind==="pause"?Ur():rf==="pause"?qe.open("pause",Ct):qe.close()}else r==="retry"?(yt="play",Ct.retry(),Ur()):r==="upgrade"?(Ct.advance(e),Ur()):r==="menu"&&(qe.close(),yt="menu",Tn.enabled=!1,Tn.clear(),An.pause(),Ct.newRun(jt.difficulty),qe.mode(yt),qe.updateTitle(),uh=performance.now(),Pt.setCamera("menu",!0),Bn())}function af(r,e){Object.hasOwn(jt,r)&&(jt[r]=e,r==="quality"&&(jt.qualityChosen=!0),Object.assign(jt,Yi({...Zt,settings:jt},hh).settings),Fs(),An?.apply(),qe.translate(),qe.kind==="settings"&&(qe.open("settings",Ct),qe.modal.querySelector(`[data-setting="${r}"]`)?.focus({preventScroll:!0})),Pt?.resize(),Bn())}function Fy(r,e){if(r==="loaded"){yt==="play"&&(Zt.unlocked=Math.max(Zt.unlocked,e.sector),Zt.checkpoint=e,Fs());return}if(r==="cell"){qe.announce(qe.t("cellFound"));return}if(r==="boss"){qe.announce(qe.t("bossDown"));return}if(r==="dash"){qe.didDash=!0;return}if(r==="pulse"){qe.didPulse=!0;return}r==="won"&&(Zt.best=Math.max(Zt.best,Ct.state.score),Zt.wins++,Zt.checkpoint=null,Zt.unlocked=2,Fs()),["dead","won","sector"].includes(r)&&(yt=r,Tn.enabled=!1,Tn.clear(),An.pause(),An.play(r==="dead"?"fail":"clear"),qe.open(r,Ct),Bn())}async function By(){try{An=new ul(jt),Pt=new Wa(document.getElementById("world"),jt),Pt.renderer.domElement.tabIndex=0,Ct=new ll(Pt,An,Fy),Tn=new cl(Pt.renderer.domElement,Ls),await Pt.renderer.compileAsync(Pt.scene,Pt.camera),Pt.draw(Ct,yt,0,performance.now()/1e3),Or=!0,qe.ready(),Ds=uh=performance.now(),Bn(),window.addEventListener("resize",()=>{Tn.clear(),Pt.resize(),Bn()}),window.addEventListener("blur",Ls),document.addEventListener("visibilitychange",()=>{document.hidden?(Ls(),An.pause(),Ns&&cancelAnimationFrame(Ns),Ns=0):(Ds=performance.now(),Bn())}),Pt.renderer.domElement.addEventListener("webglcontextlost",r=>{r.preventDefault(),Ls(),Or=!1,qe.open("error",Ct,qe.t("contextLost"))}),new URLSearchParams(location.search).has("qa")&&Object.defineProperty(window,"__SKIFT__",{value:Object.freeze({snapshot:()=>({...Ct.snapshot(),mode:yt,audio:{active:An.active,music:!!An.music?.playing()},render:Pt.stats(),perf:{frames:fn.frames,steps:fn.steps,maxCost:fn.maxCost,p95:[...fn.cost].sort((r,e)=>r-e)[Math.floor(fn.cost.length*.95)]||0},settings:{...jt}})})}),Fs()}catch(r){console.error("SKIFT startup failed",r),qe.open("error",null,/webgl/i.test(String(r))?qe.t("faultText"):qe.t("startupError")),document.getElementById("load-status").textContent=qe.t("fault")}}By();})();
/*! For license information please see app.js.LEGAL.txt */
