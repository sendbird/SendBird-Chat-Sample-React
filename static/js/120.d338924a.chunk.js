"use strict";(self.webpackChunksendbird_chat_sample_react=self.webpackChunksendbird_chat_sample_react||[]).push([[120],{120:(e,t,s)=>{s.r(t),s.d(t,{xmlHttpRequest:()=>n});var r=s(986),n=function(e,t){return new Promise((function(s,n){if("undefined"!=typeof XMLHttpRequest){var a=r.V.of(e),o=a.dispatcher,d=a.logger,i=t.requestId,u=t.method,c=t.url,p=t.headers,f=void 0===p?{}:p,l=t.data,h=void 0===l?"":l,g=t.uploadProgressHandler,m=!1,q=new XMLHttpRequest;q.open(u,c),Object.keys(f).forEach((function(e){q.setRequestHeader(e,f[e])})),g&&q.upload.addEventListener("progress",(function(e){e.lengthComputable?g(i,e.loaded,e.total):d.debug("Progress computing failed: `Content-Length` header is not given.")})),q.onabort=function(){n(r.s.requestCanceled)},q.onerror=function(e){n(r.s.networkError)},q.onreadystatechange=function(){if(q.readyState===XMLHttpRequest.DONE&&!m)if(0===q.status||q.status>=200&&q.status<400)try{var t=JSON.parse(q.responseText);s(new r.h(e,t))}catch(d){n(r.s.networkError)}else try{var a=JSON.parse(q.responseText);if(a){var d=new r.s(a);if(d.isSessionExpiredError){if(o.dispatch(new r.M({reason:d.code,message:d.message})),!(q instanceof r.br)){var i=new r.ax;return o.dispatch(new r.bs({request:q,deferred:i,error:d})),i.promise}}else d.isSessionInvalidatedError&&o.dispatch(new r.M({reason:d.code,message:d.message}));n(d)}else n(r.s.requestFailed)}catch(d){n(r.s.requestFailed)}},o.on((function(e){e instanceof r.av&&(e.requestId&&e.requestId!==i||(m=!0,q.abort()))})),q.send(h)}else n(r.s.xmlHttpRequestNotSupported)}))}}}]);
//# sourceMappingURL=120.d338924a.chunk.js.map