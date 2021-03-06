/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  Butter.Editor.register( "text", "load!{{baseDir}}templates/assets/editors/text/text-editor.html",
    function( rootElement, butter ) {

    var _this = this;

    var _rootElement = rootElement,
        _trackEvent,
        _butter,
        _popcornOptions,
        _falseClick = function() {
          return false;
        },
        _trueClick = function() {
          return true;
        };

    /**
     * Member: setup
     *
     * Sets up the content of this editor
     *
     * @param {TrackEvent} trackEvent: The TrackEvent being edited
     */
    function setup( trackEvent ) {
      _trackEvent = trackEvent;
      _popcornOptions = _trackEvent.popcornOptions;

      var basicContainer = _rootElement.querySelector( ".editor-options" ),
          advancedContainer = _rootElement.querySelector( ".advanced-options" ),
          pluginOptions = {},
          pickers = {};

      function callback( elementType, element, trackEvent, name ) {
        pluginOptions[ name ] = { element: element, trackEvent: trackEvent, elementType: elementType };
      }

      function attachHandlers() {
        var key,
            option;

        function colorCallback( te, options, message, prop ) {
          var newOpts = {};
          if ( message ) {
            _this.setErrorState( message );
            return;
          } else {
            newOpts[ prop ] = options[ prop ];
            te.update( newOpts );
          }
        }
        function checkboxCallback( trackEvent, updateOptions, prop ) {
          if ( "background shadow".match( prop ) ) {
            if ( updateOptions[ prop ] ) {
              pickers[ prop ].classList.remove( "butter-disabled" );
              pickers[ prop ].onclick = _trueClick;
            } else {
              pickers[ prop ].classList.add( "butter-disabled" );
              pickers[ prop ].onclick = _falseClick;
            }
          }
          trackEvent.update( updateOptions );
        }
        function urlCallback( trackEvent, updateOptions ) {
          if ( updateOptions.linkUrl ) {
            pickers.linkTarget.classList.remove( "butter-disabled" );
            pickers.linkTarget.disabled = false;
          } else {
            pickers.linkTarget.classList.add( "butter-disabled" );
            pickers.linkTarget.disabled = true;
          }
          trackEvent.update( updateOptions );
        }

        for ( key in pluginOptions ) {
          if ( pluginOptions.hasOwnProperty( key ) ) {
            option = pluginOptions[ key ];

            if ( option.elementType === "select" ) {
              _this.attachSelectChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              if ( key === "linkTarget" ) {
                pickers.linkTarget = option.element;
                if ( !_popcornOptions.linkUrl ) {
                  option.element.classList.add( "butter-disabled" );
                  pickers.linkTarget.disabled = true;
                }
              }
            }
            else if ( option.elementType === "input" ) {
              if ( key === "linkUrl" ) {
                _this.createTooltip( option.element, {
                  name: "text-link-tooltip" + Date.now(),
                  element: option.element.parentElement,
                  message: Butter.localized.get( "Links will be clickable when shared." ),
                  top: "105%",
                  left: "50%",
                  hidden: true,
                  hover: false
                });
              }

              if ( option.element.type === "checkbox" ) {
                _this.attachCheckboxChangeHandler( option.element, option.trackEvent, key, checkboxCallback );
              } else if ( key === "fontColor" ) {
                _this.attachColorChangeHandler( option.element, option.trackEvent, key, colorCallback );
              } else if ( key === "backgroundColor" ) {
                pickers.background = option.element;
                // set initial state
                if ( !_popcornOptions.background ) {
                  option.element.classList.add( "butter-disabled" );
                  option.element.onclick = _falseClick;
                }
                _this.attachColorChangeHandler( option.element, option.trackEvent, key, colorCallback );
              } else if ( key === "shadowColor" ) {
                pickers.shadow = option.element;
                // set initial state
                if ( !_popcornOptions.shadow ) {
                  option.element.classList.add( "butter-disabled" );
                  option.element.onclick = _falseClick;
                }
                _this.attachColorChangeHandler( option.element, option.trackEvent, key, colorCallback );
              } else if ( key === "linkUrl" ) {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, urlCallback );
              }
              else {
                _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
              }
            }
            else if ( option.elementType === "textarea" ) {
              _this.attachInputChangeHandler( option.element, option.trackEvent, key, _this.updateTrackEventSafe );
            }
          }
        }

        basicContainer.insertBefore( _this.createStartEndInputs( trackEvent, _this.updateTrackEventSafe ), basicContainer.firstChild );
      }

      // backwards comp
      if ( "center left right".match( _popcornOptions.position ) ) {
        _popcornOptions.alignment = _popcornOptions.position;
        _popcornOptions.position = "middle";
      }

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: basicContainer,
        advancedContainer: advancedContainer,
        ignoreManifestKeys: [ "start", "end" ]
      });

      attachHandlers();
      basicContainer.appendChild( _this.createSetAsDefaultsButton( trackEvent ) );
      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );
    }

    function anchorClickPrevention( anchorContainer ) {
      if ( anchorContainer ) {

        anchorContainer.onclick = _falseClick;
      }
    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;

      var anchorContainer = _trackEvent.popcornTrackEvent._container.querySelector( "a" );
      anchorClickPrevention( anchorContainer );

      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );
    }

    // Extend this object to become a TrackEventEditor
    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        var anchorContainer = trackEvent.popcornTrackEvent._container.querySelector( "a" );

        anchorClickPrevention( anchorContainer );

        _butter = butter;

        // Update properties when TrackEvent is updated
        trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
        setup( trackEvent );
      },
      close: function() {
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  }, false, function( trackEvent ) {
    var _container,
        target;

    _container = trackEvent.popcornTrackEvent._container;
    target = trackEvent.popcornTrackEvent._target;

    this.draggable( trackEvent, _container, target, {
      end: function() {
        if ( trackEvent.popcornOptions.position !== "custom" ) {
          trackEvent.update({
            position: "custom"
          });
        }
      }
    });
    this.resizable( trackEvent, _container, target, {
      minWidth: 10,
      handlePositions: "e,w",
      end: function() {
        if ( trackEvent.popcornOptions.position !== "custom" ) {
          trackEvent.update({
            position: "custom"
          });
        }
      }
    });

    this.selectable( trackEvent, _container );
    this.contentEditable( trackEvent, _container, _container.querySelector( ".text-inner-div" ) );

  });
}( window.Butter ));
