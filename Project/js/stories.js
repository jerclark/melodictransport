
// The stories system works by using hidden elements in the body of the document
// that contain their own meta data to indicate which filter should be selected and what
// section they belong to (radar, cake, tree). Data attributes are used.

// See the bottom of index.html for details.

// Additionally links can be inserted in the story text that also trigger a change
// in the selected filters.

Stories = (function() {

    var Stories = function(options) {
        this.timeline = options.timeline;
        this.callback = options.callback;
    }

    Stories.prototype.initialize = function() {
        var stories = $('.hidden.story').toArray();
        var timeline = this.timeline;
        var callback = this.callback;

        stories.forEach(function(el, idx) {
            var el = el;
            var section = $(el).data('section');

            var link = $("<a/>")
                .addClass("story-link")
                .text($(el).find("h3").first().text())
                .click(function(e) {
                    e.preventDefault();

                    var story = $(el);
                    var demographic = story.data('demographic');
                    var characteristic = story.data('characteristic');
                    var item = story.data('item');
                    var from = story.data('year-from') || '2004';
                    var to = story.data('year-to') || '2014';

                    if (demographic) $("#" + section + "-demo-picker").val(demographic);
                    if (characteristic) $("#" + section + "-char-picker").val(characteristic);
                    if (item) $("#" + section + "-item-picker").val(item);

                    timeline.setYearRange(from, to);

                    $(".current-story." + section).html($(el).html());

                    callback(this);
                });

            $(".story-picker." + section).append(link);
        });

        // Select the first story of each story section. Use _.defer
        // to wait until free cycles are available.

        $(".story-picker").each(function() {
            var el = this;
            _.defer(function() {
                $(el).find(".story-link").first().click();
            });
        });
    };

    return Stories;
})();