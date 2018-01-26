$(document).ready(initialize)
var carBot = null;
var view = null;

function initialize() {
    var image_array = [
        'images/banelings.jpg',
        'images/cuter_baneling.jpg',
        'images/illidan.jpg',
        'images/infestor.jpg',
        'images/marine.jpg',
        'images/sky_zerg.jpg',
        'images/zeratul.jpg',
        'images/zergling.jpg',
        'images/ultralisk.jpg',
    ];
    var sound_object = {
        'images/zeratul.jpg': new Audio("sounds/zeratul_goodjob.mp3"),
        'images/banelings.jpg': new Audio("sounds/baneling_roll.mp3"),
        'images/illidan.jpg': new Audio("sounds/not_prepared.mp3"),
        'images/cuter_baneling.jpg': new Audio("sounds/baneling_burst.mp3"),
        'images/infestor.jpg': new Audio("sounds/infestor_derp.mp3"),
        'images/sky_zerg.jpg': new Audio("sounds/multalisk.mp3"),
        'images/ultralisk.jpg': new Audio("sounds/ultralisk.mp3"),
        'images/marine.jpg': new Audio("sounds/marine.mp3"),
        'images/zergling.jpg': new Audio("sounds/zergling.mp3"),
        "clap": new Audio("sounds/applause.mp3"),
        "zerg_lick": new Audio("sounds/zerg_lick.mp3"),
        "rage": new Audio('sounds/Zealot_Death.mp3')
    }
    view = new View();
    carBot = new Memory_match(image_array, sound_object);
    var images = [];

    function preload(image_array) {
        for (i = 0; i < image_array.length; i++) {
            images[i] = new Image()
            images[i].src = image_array[i];
        }
        setTimeout(function () {
            carBot.start_app();
        }.bind(this), 1000);
    }
    preload(image_array);
    $(window).on('resize', view.change_card_height);
    $(window).on('load', view.change_card_height);
}

//view object 
function View() {
    this.mute = function () {
        $('.sound_off, .sound_on').toggleClass('hidden');
        if (!carBot.is_muted) {
            for (let audio in carBot.sounds) {
                carBot.sounds[audio].pause();
            }
        }
        carBot.is_muted = !carBot.is_muted;
    }.bind(this);
    this.start_app = function () {
        this.apply_click_handlers();
    }
    this.apply_click_handlers = function () {
        $('.mute_button').click(this.mute);
    }
    this.change_card_height = function () {
        let image_height = $('.back img').css('height');
        $(".front img, .back, .card, .front").css('height', image_height);
    }
    this.random_sort = function (image_array) {
        let sorted_array = [];
        while (image_array.length > 0) {
            let i = Math.floor(Math.random() * image_array.length);
            sorted_array.push(image_array.splice(i, 1));
        } //end inner while
        return sorted_array;
    } //end random_sort
    this.create_board = function (image_array) {
        //double the images
        let images = image_array.concat(image_array);
        //randomly sort the images
        let random_images = this.random_sort(images);
        for (let i = 1; i < 4; i++) {
            $('<div>').addClass('card_row').attr('id', 'row' + i).appendTo('.game_area');
        }
        for (let i = 0; i < random_images.length; i++) {
            let image = random_images[i];
            if (i < 6) {
                $('<div>').addClass('card').attr('id', 'card' + i).appendTo('#row1');
            } else if (i < 12) {
                $('<div>').addClass('card').attr('id', 'card' + i).appendTo('#row2');
            } else {
                $('<div>').addClass('card').attr('id', 'card' + i).appendTo('#row3');
            }
            $('<div>').addClass('front').prepend('<img src=' + "'" + image + "'" + '/>').appendTo('#card' + i);
            $('<div>').addClass('back').prepend('<img src="images/card_pack.png"/>').appendTo('#card' + i);
        } //end for loop
    } //end create board
}

function Memory_match(images, sounds) {
    this.images = images;
    this.sounds = sounds;
    this.is_muted = false;
    this.pair = false;
    this.lock = false;
    this.reset_lock = false;
    this.first_card_clicked = null;
    this.second_card_clicked = null;
    this.reset_stats = function () {
        this.matches = 0;
        this.attempts = 18;
        $('.attempts').css('color', 'white');
        this.accuracy = 0;
        $('.accuracy').find(".value").text(0);
    }
    this.card_clicked = function () {
        const card = $(event.target).parents('.card');
        const face = card.find('.front').hasClass('hidden');
        if (this.lock || face) {
            return;
        } //end lock check;
        if (this.first_card_clicked === null) {
            card.addClass('flipped');
            this.first_card_clicked = card;
        } //end first card check
        else if (this.first_card_clicked.attr('id') !== card.attr('id')) {
            this.attempts--;
            card.addClass('flipped');
            this.second_card_clicked = card;
            if (this.second_card_clicked.find('img').attr('src') === this.first_card_clicked.find('img').attr('src')) {
                this.first_card_clicked.find('.back').css('display', 'none');
                this.second_card_clicked.find('.back').css('display', 'none');
                var image = this.second_card_clicked.find('img').attr('src');
                if (!this.is_muted) {
                    this.sounds[image].play();
                }
                this.lock = true;
                this.toggle_disabled_reset();
                this.reset_lock = true;
                this.matches++;
                this.display_accuracy();
                this.check_win();
            } //end if match
            else {
                if (this.attempts === 0) {
                    this.display_gg();
                    setTimeout(function () {
                        this.reset_lock = false
                        this.toggle_disabled_reset();
                    }.bind(this), 1000);
                } else {
                    this.reset_lock = true;
                    this.toggle_disabled_reset();
                    setTimeout(this.reset_cards, 1000);
                } //end if too many attempts
                this.display_accuracy();
                this.lock = true;
            } //end else if no match
        } //end second card check
        this.display_stats();
    }.bind(this); //end cards clicked
    this.check_win = function () {
        if (this.attempts === 0 && this.matches !== 9) {
            this.display_gg();
            this.lock = true;
            this.reset_lock = true
            setTimeout(this.lock_delay, 1000);
        } //end if
        else {
            this.lock = true;
            this.reset_lock = true;
            $(this.first_card_clicked).find('.front').fadeOut(1500);
            $(this.second_card_clicked).find('.front').fadeOut(1500);
            setTimeout(this.reset_cards, 1000);
            self.pair = true;
            if (this.matches === 9 && this.accuracy < 60) {
                $("#modal_body").css("background-image", "url(images/balllicking.gif)");
                $("#modal_body").css("display", "block");
                if (!this.is_muted) {
                    this.sounds["zerg_lick"].play();
                }
            } //end if
            else if (this.matches === 9) {
                $('#modal_body').css("display", "block");
                if (!this.is_muted) {
                    this.sounds['clap'].play();
                }
            } //end else if
        } //end else
        return;
    } //end check win
    this.apply_click_handlers = function () {
        $('.card').click(this.card_clicked);
        $('.card').hover(function () {
            if (!$(this).find('.front').hasClass('hidden')) {
                $(this).toggleClass("glow");
            }
        });
        $('#modal_body').click(function () {
            this.reset_button();
        })
        $('.reset').hover(function () {
                if (!$('.reset').attr('disabled')) {
                    $('.reset').addClass('reset_highlight');
                }
            }, //mouse in
            function () {
                $('.reset').removeClass('reset_highlight');
            } //mouse out
        );
    } //end add click handlers
    this.display_stats = function () {
        $('.games_played').find('.value').text(this.games_played);
        $('.attempts').find('.value').text(this.attempts);
        if (this.attempts === 10) {
            $('.attempts').css('color', 'yellow');
        }
        if (this.attempts === 5) {
            $('.attempts').css('color', 'red');
        }
    } //end display stats
    this.start_app = function () {
        view.start_app();
        view.create_board(images);
        this.apply_click_handlers();
        $('.reset').click(this.reset_button);
        $('.card').addClass('flipped');
        this.lock = true;
        this.reset_lock = true;
        $('.reset')
        $('#modal_body').css('background-image', 'url(images/clapping_zerg.gif)');
        setTimeout(this.start_match, 2000);
        setTimeout(this.lock_delay, 3000);
    } //end start app
    this.start_match = function () {
        $('.card').removeClass('flipped');
        view.change_card_height();
    }.bind(this);
    this.lock_delay = function () {
        this.lock = false;
        this.reset_lock = false;
        this.toggle_disabled_reset();
    }.bind(this);
    this.display_gg = function () {
        $('#modal_body').css("background-image", "url(images/GG.gif)");
        $("#modal_body").css("display", "block");
        if (!this.is_muted) {
            sounds['rage'].play();
        }
    } //end display gg
    this.reset_button = function () {
        if (this.reset_lock === true) {
            return;
        } //end if
        this.first_card_clicked = null;
        this.second_card_clicked = null;
        this.reset_stats();
        this.display_stats();
        this.toggle_disabled_reset();
        this.games_played++;
        $('.back').removeAttr('id');
        $('.front').removeAttr('id');
        $('.game_area').html('');
        $('#modal_body').css('display', 'none');
        this.start_app();
        view.change_card_height();
    }.bind(this) //end reset button
    this.reset_cards = function () {
        this.display_stats();
        let card_1 = self.first_card_clicked;
        let card_2 = self.second_card_clicked;
        if (!this.pair) {
            card_1.removeClass('flipped');
            card_2.removeClass('flipped');
        } // if no pair
        else {
            card_1.find('.front').addClass('hidden');
            card_2.find('.front').addClass('hidden');
            if (card_1.hasClass('glow')) {
                card_1.removeClass('glow');
            } //disable glow
            if (card_2.hasClass("glow")) {
                card_2.removeClass("glow");
            } //disable glow
        } //add display none;
        this.lock = false;
        this.reset_lock = false;
        this.toggle_disabled_reset();
        this.first_card_clicked = null;
        this.second_card_clicked = null;
        this.pair = false;
    }.bind(this); //end reset cards
    this.display_accuracy = function () {
        let old_accuracy = this.accuracy;
        this.accuracy = (Math.floor(this.matches / (-(this.attempts - 18)) * 100));
        let increment = setInterval(change_accuracy.bind(this), 10);

        function change_accuracy() {
            if (old_accuracy === this.accuracy) {
                clearInterval(increment);
            } else {
                if (old_accuracy > this.accuracy) {
                    old_accuracy--;
                    $('.accuracy').find(".value").text(old_accuracy + "%");
                } else {
                    old_accuracy++;
                    $('.accuracy').find(".value").text(old_accuracy + "%");
                }
            }
        }
    }.bind(this) //end accuracy
    this.toggle_disabled_reset = function () {
        let reset_button = $('.reset');
        if (reset_button.attr('disabled')) {
            reset_button.removeAttr('disabled');
            reset_button.css('background-color', '#35bcfa');
        } else {
            reset_button.attr('disabled', true);
            reset_button.css('background-color', 'gray');
            reset_button.removeClass('reset_highlight');
        }
    }
} //end memory_match

function Modal(){
    this.matches = 0;
    this.attempts = 18;
    this.accuracy = 0;
    this.games_played = 0;
}