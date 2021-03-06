;(function ($, window, document) {

    $(document).ready(function () {

        // Get server ID
        var serverId = parseInt( $("#serverId").html() );

        // Query server online status
        queryServer();

        // Buttons
        $.fn.button && $("#mws-ui-button-radio").buttonset();

        // Spinners
        //noinspection JSUnresolvedVariable
        $.fn.spinner && $('.mws-spinner').spinner();

        // -------------------------------------------------------------------------
        // Ajax Forms
        $("#edit-server-form").dialog({
            autoOpen: false,
            title: "Edit Server Details",
            modal: true,
            width: "640",
            resizable: false,
            buttons: [{
                id: "form-submit-btn",
                text: "Submit",
                click: function () {
                    $(this).find('form#mws-validate-server').submit();
                }
            }]
        });

        $("#edit-token-form").dialog({
            autoOpen: false,
            title: "Authorize Token Addresses",
            modal: true,
            width: "500",
            resizable: false,
            buttons: [{
                id: "form-submit-btn2",
                text: "Submit",
                click: function () {
                    $(this).find('form#mws-validate-token').submit();
                }
            }]
        });

        $("#mws-jui-dialog").dialog({
            autoOpen: false,
            title: "Confirm AuthID Change",
            modal: true,
            width: "640",
            resizable: false
        });

        // -------------------------------------------------------------------------
        //noinspection JSJQueryEfficiency
        var validator = $("#mws-validate-server").validate({
            rules: {
                serverName: {
                    required: true,
                    minlength: 3,
                    maxlength: 100
                },
                serverIp: {
                    required: true
                },
                serverPort: {
                    required: true,
                    min: 1,
                    max: 65535
                },
                serverQueryPort: {
                    required: true,
                    min: 1,
                    max: 65535
                }
            },
            invalidHandler: function (form, validator) {
                var errors = validator.numberOfInvalids();
                if (errors) {
                    var message = errors === 1 ? 'You missed 1 field. It has been highlighted' : 'You missed ' + errors + ' fields. They have been highlighted';
                    $("#mws-validate-error").html(message).show();
                    $('#jui-message').hide();
                } else {
                    $("#mws-validate-error").hide();
                }
            }
        });

        //noinspection JSJQueryEfficiency
        $("#mws-validate-server").ajaxForm({
            data: { ajax: true },
            beforeSubmit: function () {
                $("#mws-validate-error").hide();
                $('#jui-message').attr('class', 'alert loading').html("Submitting form data...").slideDown(200);
                $('#form-submit-btn').prop("disabled", true);
                return true;
            },
            success: function (response) {
                // Parse the JSON response
                var result = jQuery.parseJSON(response);
                if (result.success === true) {
                    $("span#sName").html(result.serverName);
                    $("span#sAddress").html(result.serverIp);
                    $("span#sGamePort").html(result.serverPort);
                    $("span#sQueryPort").html(result.serverQueryPort);

                    // Close dialog
                    $("#edit-server-form").dialog("close");
                }
                else {
                    $('#jui-message').attr('class', 'alert error').html(result.message).slideDown(500);
                }
            },
            error: function() {
                $('#jui-message').attr('class', 'alert error').html('AJAX Error! Please check the console log.').slideDown(500);
            },
            complete: function () {
                $('#form-submit-btn').prop("disabled", false);
            },
            timeout: 15000
        });

        //noinspection JSJQueryEfficiency
        $("#mws-validate-token").ajaxForm({
            data: { ajax: true, addresses: $("select#ips").tagsinput('items') },
            beforeSubmit: function () {
                $("#mws-validate-error").hide();
                $('#jui-message').attr('class', 'alert loading').html("Submitting form data...").slideDown(200);
                $('#form-submit-btn').prop("disabled", true);
                return true;
            },
            success: function (response) {
                // Parse the JSON response
                var result = jQuery.parseJSON(response);
                if (result.success === true) {
                    // Grab the addresses span element
                    var selector = $("span#addresses");
                    selector.html('');

                    // Reset label with new addresses
                    var items = $("select#ips").val();
                    $.each(items, function(index, value) {
                        selector.append('<label class="label label-info">' + value + '</label> ');
                    });

                    // Close dialog
                    $("#edit-token-form").dialog("close");
                }
                else {
                    $('#jui-message2').attr('class', 'alert error').html(result.message).slideDown(500);
                }
            },
            error: function() {
                $('#jui-message2').attr('class', 'alert error').html('AJAX Error! Please check the console log.').slideDown(500);
            },
            complete: function () {
                $('#form-submit-btn2').prop("disabled", false);
            },
            timeout: 15000
        });

        // -------------------------------------------------------------------------
        // Edit Server Details On-Click
        $("#edit-details").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Close menu
            $(this).closest(".dropdown-menu").prev().dropdown("toggle");

            // Hide previous errors
            $('#jui-message').hide();
            $("#mws-validate-error").hide();
            validator.resetForm();

            // Set form default values
            $('input[name="serverName"]').val($("span#sName").html());
            $('input[name="serverIp"]').val($("span#sAddress").html());
            $('input[name="serverPort"]').val($("span#sGamePort").html());
            $('input[name="serverQueryPort"]').val($("span#sQueryPort").html());

            // Show dialog form
            $("#edit-server-form").dialog("option", {
                title: 'Update Server Details',
                modal: true
            }).dialog("open");

            // Just to be sure, older IE's needs this
            return false;
        });

        // Refresh Click
        $("#refresh").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // The a element does not have a property disabled. So defining one won't
            // affect any event handlers you may have attached to it. Therefore, we use data instead
            if ($(this).data('disabled')) return;

            // Show client a message
            $('#jui-global-message')
                .attr('class', 'alert loading')
                .html("Fetching Server Status and Information...")
                .slideDown(200);

            // Reload page.
            queryServer();

            // Just to be sure, older IE's needs this
            return false;
        });

        // Authorize Click
        $("#auth-server").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Push the request
            $.post( "/ASP/servers/authorize", { action: "auth", ajax: true, servers: [serverId] })
                .done(function( data ) {

                    // Parse response
                    var result = jQuery.parseJSON(data);
                    if (result.success === false) {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else {
                        $("#auth-server").hide();
                        $("#unauth-server").show();
                        $("label#authorized").html("Authorized").attr('class', 'label label-success');
                    }
                })
                .fail(function( jqXHR ) {
                    var result = jQuery.parseJSON(jqXHR.responseText);
                    if (result != null)
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("An Error Occurred. Please check the ASP error log for details.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                });

            // Just to be sure, older IE's needs this
            return false;
        });

        // Un-Authorize Click
        $("#unauth-server").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Push the request
            $.post( "/ASP/servers/authorize", { action: "unauth", ajax: true, servers: [serverId] })
                .done(function( data ) {

                    // Parse response
                    var result = jQuery.parseJSON(data);
                    if (result.success === false) {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else {
                        $("#auth-server").show();
                        $("#unauth-server").hide();
                        $("label#authorized").html("Unauthorized").attr('class', 'label label-important');
                    }
                })
                .fail(function( jqXHR ) {
                    var result = jQuery.parseJSON(jqXHR.responseText);
                    if (result != null)
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("An Error Occurred. Please check the ASP error log for details.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                });

            // Just to be sure, older IE's needs this
            return false;
        });

        // Plasma Click
        $("#plasma-server").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Push the request
            $.post( "/ASP/servers/plasma", { action: "plasma", ajax: true, servers: [serverId] })
                .done(function( data ) {

                    // Parse response
                    var result = jQuery.parseJSON(data);
                    if (result.success === false) {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else {
                        $("label#plasma").html("Yes").attr('class', 'label label-success');
                        $("#plasma-server").hide();
                        $("#unplasma-server").show();
                    }
                })
                .fail(function( jqXHR ) {
                    var result = jQuery.parseJSON(jqXHR.responseText);
                    if (result != null)
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("An Error Occurred. Please check the ASP error log for details.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                });

            // Just to be sure, older IE's needs this
            return false;
        });

        // Un-Plasma Click
        $("#unplasma-server").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Push the request
            $.post( "/ASP/servers/plasma", { action: "unplasma", ajax: true, servers: [serverId] })
                .done(function( data ) {

                    // Parse response
                    var result = jQuery.parseJSON(data);
                    if (result.success === false) {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else {
                        $("label#plasma").html("No").attr('class', 'label label-inactive');
                        $("#unplasma-server").hide();
                        $("#plasma-server").show();
                    }
                })
                .fail(function( jqXHR ) {
                    var result = jQuery.parseJSON(jqXHR.responseText);
                    if (result != null)
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    else
                    {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("An Error Occurred. Please check the ASP error log for details.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                });

            // Just to be sure, older IE's needs this
            return false;
        });

        // Edit Server Details On-Click
        $("#edit-addresses").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Close dropdown menu
            $(".dropdown-menu").dropdown("toggle");

            // Hide previous errors
            $('#jui-message2').hide();
            $("#mws-validate-error2").hide();

            // Set form default values
            var input = $('select#ips');
            $('span#addresses').children('label').each(function(i) {
                var addy = $(this).html();
                input.tagsinput('add', addy);
            });

            // Show dialog form
            $("#edit-token-form").dialog("option", {
                title: 'Authorized Server Ip Addresses',
                modal: true
            }).dialog("open");

            // Just to be sure, older IE's needs this
            return false;
        });

        // Generate New Auth ID
        $("#gen-auth-id").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Close dropdown menu
            $(".dropdown-menu").dropdown("toggle");

            // Show dialog form
            $("#mws-jui-dialog")
                .html('Are you sure you want to generate a new AuthID? You should never have to change an AuthID unless it has been compromised. \
                    The server owner will need to be notified of this change before they will be able to post stats data again!')
                .dialog("option", {
                    title: "Confirm AuthID Change",
                    modal: true,
                    buttons: [{
                        text: "Confirm",
                        class: "btn btn-danger",
                        click: function () {

                            $.post( "/ASP/servers/token", { ajax: true, action: "newId", serverId: serverId })
                                .done(function( data ) {
                                    // Parse response
                                    var result = jQuery.parseJSON(data);
                                    if (result.success === false) {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html(result.message)
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                    else {
                                        // Reload window
                                        $("#currentAuthId").html(result.message);
                                    }
                                })
                                .fail(function( jqXHR ) {
                                    var result = jQuery.parseJSON(jqXHR.responseText);
                                    if (result != null)
                                    {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html(result.message)
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                    else
                                    {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html("An Error Occurred. Please check the ASP error log for details.")
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                });

                            // Close dialog
                            $(this).dialog("close");
                        }
                    },
                        {
                            text: "Cancel",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                }).dialog("open");

            // Just to be sure, older IE's needs this
            return false;
        });

        // Generate New Auth Token
        $("#gen-auth-token").on('click', function(e) {

            // For all modern browsers, prevent default behavior of the click
            e.preventDefault();

            // Close dropdown menu
            $(".dropdown-menu").dropdown("toggle");

            // Show dialog form
            $("#mws-jui-dialog")
                .html('Are you sure you want to generate a new AuthToken? The server owner will need to be notified of this change before they will be able to post stats data again!')
                .dialog("option", {
                    title: "Confirm AuthToken Change",
                    modal: true,
                    buttons: [{
                        text: "Confirm",
                        class: "btn btn-danger",
                        click: function () {

                            $.post( "/ASP/servers/token", { ajax: true, action: "newToken", serverId: serverId })
                                .done(function( data ) {
                                    // Parse response
                                    var result = jQuery.parseJSON(data);
                                    if (result.success === false) {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html(result.message)
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                    else {
                                        // Reload window
                                        $("#currentAuthToken").html(result.message);
                                    }
                                })
                                .fail(function( jqXHR ) {
                                    var result = jQuery.parseJSON(jqXHR.responseText);
                                    if (result != null)
                                    {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html(result.message)
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                    else
                                    {
                                        $('#jui-global-message')
                                            .attr('class', 'alert error')
                                            .html("An Error Occurred. Please check the ASP error log for details.")
                                            .append('<span class="close-bt"></span>')
                                            .slideDown(500);
                                    }
                                });

                            // Close dialog
                            $(this).dialog("close");
                        }
                    },
                        {
                            text: "Cancel",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                }).dialog("open");

            // Just to be sure, older IE's needs this
            return false;
        });

        //////////////////////////////////////////////////////
        // Charts
        /////////////////////////////////////////////////////
        if($.plot) {

            var plot = $.plot($("#mws-line-chart"), [{
                label: "Games Processed by this Server",
                color: "#c75d7b"
            }, {
                label: "Total Games Processed",
                color: "#c5d52b"
            }], {
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){ // expects to pass these arguments
                        return "%s : %y";
                    },
                    defaultTheme: false,
                    cssClass: 'flotTip'
                },
                series: {
                    lines: {
                        show: true,
                        fill: false
                    },
                    points: {
                        show: true
                    }
                },
                grid: {
                    borderWidth: 0,
                    hoverable: true,
                    clickable: true
                },
                yaxis: {
                    minTickSize: 1,
                    tickDecimals: 0,
                    min:0
                }
            });

            // On Window Resize, redraw chart
            $(window).resize(function() {
                plot.resize();
                plot.setupGrid();
                plot.draw();
            });
        }

        var $result;
        var $loaded = false;

        // Load graph points
        $.getJSON("/ASP/servers/chartData/" + serverId, function(result){
            $result  = result;
            $loaded = true;

            //noinspection JSUnresolvedVariable
            plot.setData([{
                data: $result.week.y.server,
                label: "Games Processed by this Server",
                color: "#c75d7b"
            }, {
                data: $result.week.y.total,
                label: "Total Games Processed",
                color: "#c5d52b"
            }]);

            plot.getAxes().xaxis.options.min = 0;
            //noinspection JSUnresolvedVariable
            plot.getAxes().xaxis.options.max = $result.week.x.total.length - 1;
            //noinspection JSUnresolvedVariable
            plot.getAxes().xaxis.options.ticks = $result.week.x.total;
            plot.setupGrid();
            plot.draw();
        });

        $('#weekRadio').on('click', function() {
            if ($loaded) {
                //noinspection JSUnresolvedVariable
                plot.setData([{
                    data: $result.week.y.server,
                    label: "Games Processed by this Server",
                    color: "#c75d7b"
                }, {
                    data: $result.week.y.total,
                    label: "Total Games Processed",
                    color: "#c5d52b"
                }]);

                plot.getAxes().xaxis.options.min = 0;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.max = $result.week.x.total.length - 1;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.ticks = $result.week.x.total;
                plot.setupGrid();
                plot.draw();
            }
        });

        $('#monthRadio').on('click', function() {
            if ($loaded) {
                //noinspection JSUnresolvedVariable
                plot.setData([{
                    data: $result.month.y.server,
                    label: "Games Processed by this Server",
                    color: "#c75d7b"
                }, {
                    data: $result.month.y.total,
                    label: "Total Games Processed",
                    color: "#c5d52b"
                }]);

                plot.getAxes().xaxis.options.min = 0;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.max = $result.month.x.total.length - 1;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.ticks = $result.month.x.total;
                plot.setupGrid();
                plot.draw();
            }
        });

        $('#yearRadio').on('click', function() {
            if ($loaded) {
                //noinspection JSUnresolvedVariable
                plot.setData([{
                    data: $result.year.y.server,
                    label: "Games Processed by this Server",
                    color: "#c75d7b"
                }, {
                    data: $result.year.y.total,
                    label: "Total Games Processed",
                    color: "#c5d52b"
                }]);

                plot.getAxes().xaxis.options.min = 0;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.max = $result.year.x.total.length - 1;
                //noinspection JSUnresolvedVariable
                plot.getAxes().xaxis.options.ticks = $result.year.x.total;
                plot.setupGrid();
                plot.draw();
            }
        });

        /**
         * Credits to: http://stackoverflow.com/a/5682483/841267
         *
         * @param src
         */
        function checkImage(src) {
            var img = new Image();
            img.onload = function() {
                // code to set the src on success
                $("#server-image").attr("src", src);
            };
            img.onerror = function() {
                // doesn't exist or error loading
            };

            img.src = src; // fires off loading of image
        }

        function queryServer() {

            $("#refresh").data('disabled',true);

            // Fetch online status of server
            $.ajax({
                url: "/ASP/servers/status",
                type: "POST",
                data: { action: "status", ajax: true, serverId: serverId },
                dataType: "json",
                timeout: 10000, // in milliseconds
                success: function(result) {
                    // process data here
                    if (result == null) {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("Received empty response from AJAX request.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                    // Parse response
                    else if (result.success === true) {

                        // If the server is offline, show that.
                        if (!result.online) {
                            // Fill the rest of the screen
                            $("#status").html("Offline").attr('class', 'label label-important');
                            $('#details').html("");
                            $("#jui-global-message").slideUp(200);
                            $("#refresh").data('disabled', false);

                            // Resize Graph
                            $("#graph").attr('class', 'mws-panel grid_8');
                            $("#mws-line-chart").height(360);
                            plot.resize();

                            return;
                        }

                        // Server is online!
                        $('#details').html(result.message);
                        $("#status").html("Online").attr('class', 'label label-success');
                        $("#jui-global-message").slideUp(200);

                        // Resize Graph
                        $("#graph").attr('class', 'mws-panel grid_5');
                        $("#mws-line-chart").height(280);
                        plot.resize();

                        // Set image
                        checkImage(result.image);

                        /* Collapsible FIX on new panels */
                        $( '.mws-panel.mws-collapsible' ).each(function(i, element) {
                            var p = $( element ),
                                header = p.find( '.mws-panel-header' );

                            if( header && header.length) {
                                var btn = $('<div class="mws-collapse-button mws-inset"><span></span></div>').appendTo(header);
                                $('span', btn).on( 'click', function(e) {
                                    var p = $( this ).parents( '.mws-panel' );
                                    if( p.hasClass('mws-collapsed') ) {
                                        p.removeClass( 'mws-collapsed' )
                                            .children( '.mws-panel-inner-wrap' ).hide().slideDown( 250 );
                                    } else {
                                        p.children( '.mws-panel-inner-wrap' ).slideUp( 250, function() {
                                            p.addClass( 'mws-collapsed' );
                                        });
                                    }
                                    e.preventDefault();
                                });
                            }

                            if( !p.children( '.mws-panel-inner-wrap' ).length ) {
                                p.children( ':not(.mws-panel-header)' )
                                    .wrapAll( $('<div></div>').addClass( 'mws-panel-inner-wrap' ) );
                            }
                        });

                        // Re-enable button
                       $("#refresh").data('disabled', false);

                        // Data Tables
                        $(".mws-table").DataTable({
                            bPaginate: false,
                            bFilter: false,
                            bInfo: false,
                            order: [[ 2, "desc" ]],
                            columnDefs: [
                                { "orderable": false, "targets": 0 }
                            ]
                        });
                    }
                    else {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html(result.message)
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);

                        // Fill the rest of the screen
                        $("#status").html("Offline").attr('class', 'label label-important');
                    }
                },
                error: function(request, status) {
                    if(status === "timeout") {
                        $('#jui-global-message')
                            .attr('class', 'alert error')
                            .html("Request Timed Out.")
                            .append('<span class="close-bt"></span>')
                            .slideDown(500);
                    }
                }
            });
        }
    });
})(jQuery, window, document);