function wrapObject(thread, obj) {
  var objectType = typeof obj;
  if (Array.isArray(obj)) {
    return wrapArray(thread, obj);
  } else if (objectType === 'string') {
    return wrapString(thread, obj);
  } else if (objectType === 'number') {
    return wrapNumber(thread, obj);
  } else {
    return obj;
  }
}

function wrapString(thread, obj) {
  return javapoly.jvm.internString(obj);
}

function wrapArray(thread, obj) {
  var wrappedArr = [];
  for (var i = 0; i < obj.length; i++) {
    wrappedArr.push(wrapObject(thread, obj[i]));
  }
  return util.newArrayFromData(
    thread,
    thread.getBsCl(),
    '[Ljava/lang/Object;',
    wrappedArr
  );
}

function wrapNumber(thread, obj) {
  return util.boxPrimitiveValue(
    thread,
    'D',
    obj
  )
}

function unwrapObject(thread, obj) {
  if (obj === null)
    return null;
  if (obj['getClass']) {
    var cls = obj.getClass();
    if (cls.className === 'Ljava/lang/String;') {
      return obj.toString();
    } else if (cls.className.charAt(0) === '[') {
      var nativeArray = [];
      for (var i = 0; i < obj.array.length; i++) {
        nativeArray.push(unwrapObject(thread, obj.array[i]));
      }
      return nativeArray;
    } else {
      return obj.unbox();
    }
  }
}

registerNatives({
  'javapoly/Main': {

    'println(Ljava/lang/String;)V': function(thread, text) {
       console.log("JVM>", text.toString());
     },

    'dispatchMessage(Ljava/lang/Object;)V': function(thread, msgId) {
      var callback = window.javaPolyCallbacks[msgId];
      delete window.javaPolyCallbacks[msgId];
      thread.setStatus(6); // ASYNC_WAITING
      callback(thread, function() {
        thread.asyncReturn();
      });
    },

    'returnResult(Ljava/lang/Object;Ljava/lang/Object;)V': function(thread, msgId, returnValue) {
       var callback = window.javaPolyCallbacks[msgId];
       delete window.javaPolyCallbacks[msgId];
       callback(unwrapObject(thread, returnValue));
     },

    'installListener()V': function(thread) {
      if (!window.javaPolyEvents)
        window.javaPolyEvents = [];
      if (!window.isJavaPolyWorker) {
        window.addEventListener("message", function(event) {
        if (event.origin == window.location.origin) {
          if (typeof (event.data.javapoly) == "object") {
            event.preventDefault();
            window.javaPolyEvents.push(event);

            if (window.javaPolyCallback) {
              window.javaPolyCallback();
            }
          }
        }
        });
    	}
      if (window.javaPolyInitialisedCallback) {
        var callback = window.javaPolyInitialisedCallback;
        delete window.javaPolyInitialisedCallback;
        callback();
      }
    },

    'getMessageId()[Ljava/lang/Object;': function(thread) {
       if (window.javaPolyEvents.length > 0) {
         var event = window.javaPolyEvents.pop();
         return wrapObject(thread, event.data.javapoly.messageId);
       } else {
         thread.setStatus(6); // ASYNC_WAITING
         window.javaPolyCallback = function() {
           delete window.javaPolyCallback;
           var event = window.javaPolyEvents.pop();
           thread.asyncReturn( wrapObject(thread, event.data.javapoly.messageId) );
         }
       }
    },

    'getMessageType(Ljava/lang/Object;)Ljava/lang/String;': function(thread, msgId) {
      if (typeof window.javaPolyMessageTypes[msgId] !== 'undefined') {
        var unwrappedData = window.javaPolyMessageTypes[msgId];
        return wrapObject(thread, unwrappedData);
      } else {
        return null;
      }
    },

    'getData(Ljava/lang/Object;)[Ljava/lang/Object;': function(thread, msgId) {
      if (typeof window.javaPolyData[msgId] !== 'undefined') {
        var unwrappedData = window.javaPolyData[msgId];
        return wrapObject(thread, unwrappedData);
      } else {
        return null;
      }
    }
  }
});
