/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "localized", "util/dragndrop", "util/lang", "editor/editor", "analytics", "l10n!/layouts/plugin-list-editor.html" ],
  function( Localized, DragNDrop, LangUtils, Editor, analytics, EDITOR_LAYOUT ) {

  return function( butter ) {

    var _parentElement = LangUtils.domFragment( EDITOR_LAYOUT, ".plugin-list-editor" ),
        _containerElement = _parentElement.querySelector( ".plugin-container" ),
        _targets = butter.targets,
        _iframeCovers = document.querySelectorAll( ".butter-iframe-fix" );

    var _pluginArchetype = _containerElement.querySelector( ".butter-plugin-tile" );
    _pluginArchetype.parentNode.removeChild( _pluginArchetype );

    Editor.register( "plugin-list", null, function( rootElement, butter ) {
      rootElement = _parentElement;

      Editor.BaseEditor.extend( this, butter, rootElement, {
        open: function() {
        },
        close: function() {
        }
      });
    }, true );

    butter.listen( "pluginadded", function( e ) {
      var element = _pluginArchetype.cloneNode( true ),
          iconImg = e.data.helper,
          icon = element.querySelector( ".butter-plugin-icon" ),
          text = element.querySelector( ".butter-plugin-label" ),
          pluginName = e.data.name;

      DragNDrop.helper( element, {
        start: function() {
          for ( var i = 0, l = _targets.length; i < l; ++i ) {
            _targets[ i ].view.blink();
            _iframeCovers[ i ].style.display = "block";
          }
        },
        stop: function() {
          butter.currentMedia.pause();
          for ( var i = 0, l = _targets.length; i < l; ++i ) {
            _iframeCovers[ i ].style.display = "none";
          }
        }
      });

      function onClick() {
        if ( butter.currentMedia.ready ) {
          butter.deselectAllTrackEvents();
          butter.generateSafeTrackEvent({
            type: e.data.type,
            popcornOptions: {
              start: butter.currentTime
            }
          }, function( trackEvent ) {
            analytics.event( "Track Event Added", {
              label: "clicked"
            });
            butter.editor.editTrackEvent( trackEvent );
          });
        }
      }

      element.addEventListener( "click", onClick, false );

      if ( iconImg ) {
        icon.style.backgroundImage = "url('" + iconImg.src + "')";
      }

      text.innerHTML = Localized.get( pluginName );

      element.setAttribute( "data-popcorn-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );

      if ( e.data.hidden ) {
        element.style.display = "none";
      }

      _containerElement.appendChild( element );
    });

  };
});
