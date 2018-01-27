$(document).ready(initialize)
let carBot = null;
let view = null;
let modal = null;

function initialize() {
    //front images for cards
    const image_array = [
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
    //sound files for game
    const sound_object = {
        'images/zeratul.jpg': new Audio("sounds/zeratul_goodjob.mp3"),
        'images/banelings.jpg': new Audio("sounds/banelings.mp3"),
        'images/illidan.jpg': new Audio("sounds/illidan.mp3"),
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
    //create game objects
    modal = new Modal(image_array, sound_object);
    view = new View();
    controller = new Controller();
    //preload images
    view.preload_images(image_array);
    setTimeout(function () {
        controller.start_app();
    }.bind(this), 1000);
    $(window).on('resize', view.change_card_height);
    $(window).on('load', view.change_card_height);
}

//view object 
function View() {
    this.loaded_images = [];    
    this.mute = () => {
        $('.sound_off, .sound_on').toggleClass('hidden');
        if (!modal.is_muted) {
            for (let audio in modal.sounds) {
                modal.sounds[audio].pause();
            }
        }
        modal.is_muted = !modal.is_muted;
    };

    this.start_app = () => {
        this.create_board(modal.images);
        this.apply_click_handlers();
        $('.card').addClass('flipped');
    }
    this.apply_click_handlers = () => {
        $('.mute_button').click(this.mute);
        $('.card').click(controller.handle_card_clicked);
        $('.reset').click(controller.handle_reset_button);
        $('.card').hover(function() {
            if (!$(this).find('.front').hasClass('hidden')) {
                $(this).toggleClass("glow");
            }
        });
        $('#modal_body').click(controller.handle_reset_button);
        $('.reset').hover(
            () => {
                if (!$('.reset').attr('disabled')) {
                    $('.reset').addClass('reset_highlight');
                }
            }, //mouse in
            () => {
                $('.reset').removeClass('reset_highlight');
            } //mouse out
        );
    }
    this.change_card_height = () => {
        let image_height = $('.back img').css('height');
        $(".front img, .back, .card, .front").css('height', image_height);
    }
    this.preload_images = (image_array) => {
        for (i = 0; i < image_array.length; i++) {
            this.loaded_images[i] = new Image()
            this.loaded_images[i].src = image_array[i];
        }
    }
    this.random_sort = (image_array) => {
        let sorted_array = [];
        while (image_array.length > 0) {
            let i = Math.floor(Math.random() * image_array.length);
            sorted_array.push(image_array.splice(i, 1));
        } //end inner while
        return sorted_array;
    } //end random_sort
    this.create_board = (image_array) => {
        //double the images
        let images = [...image_array, ...image_array];
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

    this.display_stats = () => {
        $('.games_played').find('.value').text(modal.games_played);
        $('.attempts').find('.value').text(modal.attempts);
        if (modal.attempts === 10) {
            $('.attempts').css('color', 'yellow');
        }
        if (modal.attempts === 5) {
            $('.attempts').css('color', 'red');
        }
    } //end display stats

    this.flip_cards = () => {
        $('.card').removeClass('flipped');
        view.change_card_height();
    };

    this.display_gg = function () {
        $('#modal_body').css("background-image", "url(images/GG.gif)");
        $("#modal_body").css("display", "block");
        if (!modal.is_muted) {
            modal.sounds['rage'].play();
        }
    } //end display gg

    this.display_accuracy = () => {
        const change_accuracy = () => {
            if (old_accuracy === modal.accuracy) {
                clearInterval(increment);
            } else {
                if (old_accuracy > modal.accuracy) {
                    old_accuracy--;
                    $('.accuracy').find(".value").text(old_accuracy + "%");
                } else {
                    old_accuracy++;
                    $('.accuracy').find(".value").text(old_accuracy + "%");
                }
            }
        }
        let old_accuracy = modal.accuracy;
        modal.accuracy = (Math.floor(modal.matches / (-(modal.attempts - 18)) * 100));
        let increment = setInterval(change_accuracy, 10);
    } //end accuracy
}

function Controller(images, sounds) {

    this.pair = false;
    this.lock = false;
    this.reset_lock = false;
    this.first_card_clicked = null;
    this.second_card_clicked = null;
    
    this.reset_stats = function () {
        modal.matches = 0;
        modal.attempts = 18;
        $('.attempts').css('color', 'white');
        modal.accuracy = 0;
        $('.accuracy').find(".value").text(0);
    }

    this.handle_card_clicked = () => {
        const card = $(event.target).parents('.card');
        const face = card.hasClass('hidden');
        if (this.lock || face) {
            return;
        } //end lock check;
        if (this.first_card_clicked === null) {
            card.addClass('flipped');
            this.first_card_clicked = card;
        } //end first card check
        //prevent user from clicking same card
        else if (this.first_card_clicked.attr('id') !== card.attr('id')) {
            modal.attempts--;
            card.addClass('flipped');
            this.second_card_clicked = card;
            //check for match
            if (this.second_card_clicked.find('img').attr('src') === this.first_card_clicked.find('img').attr('src')) {
                this.first_card_clicked.find('.back').css('display', 'none');
                this.second_card_clicked.find('.back').css('display', 'none');
                const image = this.second_card_clicked.find('img').attr('src');
                if (!modal.is_muted) {
                    modal.sounds[image].play();
                }
                this.lock = true;
                this.toggle_disabled_reset();
                this.reset_lock = true;
                modal.matches++;
                view.display_accuracy();
                this.check_win();
            } //end if match
            //no match, reset cards and check for lost
            else {
                if (modal.attempts === 0) {
                    view.display_gg();
                    setTimeout(() => {
                        this.reset_lock = false
                        this.toggle_disabled_reset();
                    }, 1000);
                } else {
                    this.reset_lock = true;
                    this.toggle_disabled_reset();
                    setTimeout(this.reset_cards, 1000);
                } //end if too many attempts
                view.display_accuracy();
                this.lock = true;
            } //end else if no match
        } //end second card check
        view.display_stats();
    } //end cards clicked

    this.check_win = () => {
        if (modal.attempts === 0 && modal.matches !== 9) {
            view.display_gg();
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
            this.pair = true;
            if (modal.matches === 9 && modal.accuracy < 70) {
                $("#modal_body").css("background-image", "url(images/balllicking.gif)");
                $("#modal_body").css("display", "block");
                if (!modal.is_muted) {
                    modal.sounds["zerg_lick"].play();
                }
            } //end if
            else if (modal.matches === 9) {
                $('#modal_body').css("display", "block");
                $('#modal_body').css('background-image', 'url(images/clapping_zerg.gif)');
                if (!modal.is_muted) {
                    modal.sounds['clap'].play();
                }
            } //end else if
        } //end else
        return;
    } //end check win

    this.start_app = () => {
        view.start_app();
        this.lock = true;
        this.reset_lock = true;
        setTimeout(view.flip_cards, 2000);
        setTimeout(this.lock_delay, 3000);
    } //end start app

    this.lock_delay = () => {
        this.lock = false;
        this.reset_lock = false;
        this.toggle_disabled_reset();
    };

    this.handle_reset_button = () => {
        if (this.reset_lock === true) {
            return;
        } //end if
        this.first_card_clicked = null;
        this.second_card_clicked = null;
        modal.games_played++;
        this.reset_stats();
        view.display_stats();
        this.toggle_disabled_reset();
        $('.back').removeAttr('id');
        $('.front').removeAttr('id');
        $('.game_area').html('');
        $('#modal_body').css('display', 'none');
        this.start_app();
        view.change_card_height();
    } //end reset button

    this.reset_cards = () => {
        view.display_stats();
        var card_1 = this.first_card_clicked;
        var card_2 = this.second_card_clicked;
        if (!this.pair) {
            card_1.removeClass('flipped');
            card_2.removeClass('flipped');
        } // if not pair
        else {
            card_1.addClass('hidden');
            card_2.addClass('hidden');
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
    }; //end reset cards

    this.toggle_disabled_reset = () => {
        let reset_button = $('.reset');
        if (!this.reset_lock) {
            reset_button.removeAttr('disabled');
            reset_button.css('background-color', '#35bcfa');
        } else {
            reset_button.attr('disabled', true);
            reset_button.css('background-color', 'gray');
            reset_button.removeClass('reset_highlight');
        }
    }
} //end memory_match

function Modal(images, sounds) {
    this.matches = 0;
    this.attempts = 18;
    this.accuracy = 0;
    this.games_played = 0;
    this.is_muted = false;
    this.images = images;
    this.sounds = sounds;
}