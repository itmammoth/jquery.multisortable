/**
 * jquery.multisortable.js
 * https://github.com/itmammoth/jquery.multisortable Forked from https://github.com/FeepingCreature/jquery.multisortable
 */

!function($) {

    $.fn.multiselectable = function(options) {
        options = $.extend({}, $.fn.multiselectable.defaults, options || {});

        function mouseDown(e) {
            var item = $(this),
                parent = item.parent(),
                myIndex = item.index();

            var prev = parent.find('.multiselectable-previous');
            // If no previous selection found, start selecting from first selected item.
            prev = prev.length ? prev : $(parent.find('.' + options.selectedClass)[0]).addClass('multiselectable-previous');
            var prevIndex = prev.index();

            if (e.ctrlKey || e.metaKey) {
                if (item.hasClass(options.selectedClass)) {
                    item.removeClass(options.selectedClass).removeClass('multiselectable-previous')
                    if (item.not('.child').length) {
                        item.nextUntil(':not(.child)').removeClass(options.selectedClass);
                    }
                }
                else {
                    parent.find('.multiselectable-previous').removeClass('multiselectable-previous');
                    item.addClass(options.selectedClass).addClass('multiselectable-previous')
                    if (item.not('.child').length) {
                        item.nextUntil(':not(.child)').addClass(options.selectedClass);
                    }
                }
            }

            if (e.shiftKey) {
                var last_shift_range = parent.find('.multiselectable-shift');
                last_shift_range.removeClass(options.selectedClass).removeClass('multiselectable-shift');

                var shift_range;
                if (prevIndex < myIndex) {
                    shift_range = item.prevUntil('.multiselectable-previous').add(prev).add(item);
                }
                else if (prevIndex > myIndex) {
                    shift_range = item.nextUntil('.multiselectable-previous').add(prev).add(item);
                }
                shift_range.addClass(options.selectedClass).addClass('multiselectable-shift');
            }
            else {
                parent.find('.multiselectable-shift').removeClass('multiselectable-shift');
            }

            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                // no - selection is global, not local
                // parent.find('.multiselectable-previous').removeClass('multiselectable-previous');
                $('.multiselectable-previous').removeClass('multiselectable-previous');
                if (!item.hasClass(options.selectedClass)) {
                    parent.find('.' + options.selectedClass).removeClass(options.selectedClass);
                    item.addClass(options.selectedClass).addClass('multiselectable-previous');
                    if (item.not('.child').length) {
                        item.nextUntil(':not(.child)').addClass(options.selectedClass);
                    }
                }
            }

            options.mousedown(e, item);
        }

        function click(e) {
            if ( $(this).is('.ui-draggable-dragging') ) {
                return;
            }

            var item = $(this),	parent = item.parent();

            // If item wasn't draged and is not multiselected, it should reset selection for other items.
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                // no - selection is global, not local
                // parent.find('.multiselectable-previous').removeClass('multiselectable-previous');
                // parent.find('.' + options.selectedClass).removeClass(options.selectedClass);
                $('.multiselectable-previous').removeClass('multiselectable-previous');
                $('.' + options.selectedClass).removeClass(options.selectedClass);
                item.addClass(options.selectedClass).addClass('multiselectable-previous');
                if (item.not('.child').length) {
                    item.nextUntil(':not(.child)').addClass(options.selectedClass);
                }
            }

            options.click(e, item);
        }

        return this.each(function() {
            var list = $(this);

            if (!list.data('multiselectable')) {
                var clickable = options.cancel ? options.items + ':not("' + options.cancel + '")' : options.items;
                list.data('multiselectable', true)
                    .delegate(clickable, 'mousedown', mouseDown)
                    .delegate(clickable, 'click', click)
                    .disableSelection();
            }
        })
    };

    $.fn.multiselectable.defaults = {
        click: function(event, elem) {},
        mousedown: function(event, elem) {},
        selectedClass: 'selected',
        items: 'li',
        cancel: '',
    };


    $.fn.multisortable = function(options) {
        options = options || {};
        var settings = $.extend({}, $.fn.multisortable.defaults, options);

        // fix to keep compatibility using prototype.js and jquery together
        $.fn.reverse = Array.prototype._reverse || Array.prototype.reverse;

        function regroup(item, list) {
            if (list.find('.' + settings.selectedClass).length > 0) {
                var myIndex = item.data('i');

                var itemsBefore = list.find('.' + settings.selectedClass).filter(function() {
                    return $(this).data('i') < myIndex
                }).css({
                    position: '',
                    width: '',
                    left: '',
                    top: '',
                    zIndex: ''
                });

                item.before(itemsBefore);

                var itemsAfter = list.find('.' + settings.selectedClass).filter(function() {
                    return $(this).data('i') > myIndex
                }).css({
                    position: '',
                    width: '',
                    left: '',
                    top: '',
                    zIndex: ''
                });

                item.after(itemsAfter);

                setTimeout(function() {
                    itemsAfter.add(itemsBefore).addClass(settings.selectedClass);
                }, 0);
            }
        }

        return this.each(function() {
            var list = $(this);

            //enable multi-selection
            list.multiselectable({
                selectedClass: settings.selectedClass,
                click: settings.click,
                items: settings.items,
                cancel: settings.cancel,
                mousedown: settings.mousedown
            });

            //enable sorting
            options.cancel = settings.items + ':not(.' + settings.selectedClass + ')';
            options.placeholder = settings.placeholder;
            options.start = function(event, ui) {
                if (ui.item.hasClass(settings.selectedClass)) {
                    var parent = ui.item.parent();

                    //assign indexes to all selected items
                    parent.find('.' + settings.selectedClass).each(function(i) {
                        $(this).data('i', i);
                    });

                    // adjust placeholder size to be size of items
                    switch (settings.orientation) {
                        case 'vertical':
                            var height = sum(parent.find('.' + settings.selectedClass), function(el) {
                                return $(el).outerHeight();
                            });
                            ui.placeholder.height(height);
                            break;
                        case 'horizontal':
                            var width = sum(parent.find('.' + settings.selectedClass), function(el) {
                                return $(el).outerWidth();
                            });
                            ui.placeholder.width(width);
                            break;
                    }
                }

                settings.start(event, ui);
            };

            options.beforeStop = function(event, ui) {
                settings.beforeStop.call(this, event, ui);
                regroup(ui.item, ui.item.parent());
            };

            options.stop = function(event, ui) {
                regroup(ui.item, ui.item.parent());
                settings.stop(event, ui);
            };

            options.sort = function(event, ui) {
                var parent = ui.item.parent(),
                    myIndex = ui.item.data('i'),
                    selectedItems = $('.' + settings.selectedClass, parent);

                var prevItems = selectedItems.filter(function() {
                    return $(this).data('i') < myIndex;
                });
                var followingItems = selectedItems.filter(function() {
                    return $(this).data('i') > myIndex;
                });

                switch (settings.orientation) {
                    case 'vertical':
                        sortVertical(ui.item, prevItems, followingItems);
                        break;
                    case 'horizontal':
                        sortHorizontal(ui.item, prevItems, followingItems);
                        break;
                }

                settings.sort(event, ui);
            };

            options.receive = function(event, ui) {
                regroup(ui.item, ui.sender);
                settings.receive(event, ui);
            };

            list.sortable(options).disableSelection();
        });
    };

    var sortVertical = function(uiItem, prevItems, followingItems) {
        var top = uiItem.position().top,
            left = uiItem.position().left,
            height = 0;

        prevItems.reverse().each(function() {
            var item = $(this);
            height += item.outerHeight();
            item.css({
                left: left,
                top: top - height,
                position: 'absolute',
                zIndex: 1000,
                width: item.width()
            });
        });

        height = uiItem.outerHeight();
        followingItems.each(function() {
            var item = $(this);
            item.css({
                left: left,
                top: top + height,
                position: 'absolute',
                zIndex: 1000,
                width: item.width()
            });
            height += item.outerHeight();
        });
    };

    var sortHorizontal = function(uiItem, prevItems, followingItems) {
        var top = uiItem.position().top,
            left = uiItem.position().left,
            width = 0;

        prevItems.reverse().each(function() {
            var item = $(this);
            width += item.outerWidth();
            item.css({
                left: left - width,
                top: top,
                position: 'absolute',
                zIndex: 1000,
                width: item.width()
            });
        });

        width = uiItem.outerWidth();
        followingItems.each(function() {
            var item = $(this);
            item.css({
                left: left + width,
                top: top,
                position: 'absolute',
                zIndex: 1000,
                width: item.width()
            });
            width += item.outerWidth();
        });
    };

    var sum = function(jq, func) {
        var memo = 0;
        jq.each(function(i, el) {
            memo += func(el);
        });
        return memo;
    };

    $.fn.multisortable.defaults = {
        start: function(event, ui) {},
        beforeStop: function(event, ui) {},
        stop: function(event, ui) {},
        sort: function(event, ui) {},
        receive: function(event, ui) {},
        click: function(event, elem) {},
        mousedown: function(event, elem) {},
        selectedClass: 'selected',
        placeholder: 'placeholder',
        items: 'li',
        cancel: '',
        orientation: 'vertical',
    };

}(jQuery);
