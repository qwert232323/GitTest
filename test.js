let WebUI = {}

WebUI.WidgetTypes = {
    UNDEFINED:      "undefind",
    TEXT:           "text",
    IMAGE:          "image",
    PUSH_BUTTON:    "push_button",
    TEXT_FIELD:     "text_field",
    SWITCH:         "switch",
};

WebUI.widgets = [];
WebUI.focused_widget = null;
WebUI.dragged_widget = null;
WebUI.hovered_widget = null;

WebUI.is_mouse_dragging = false;       
WebUI.mouse_drag_start = {x:0, y:0};
WebUI.mouse_drag_prev = {x:0, y:0};

WebUI.initialize = function() {
    this.canvas = new fabric.Canvas("c", {
        backgroundColor: "#eee",
        hoverCursor: "default",
        selection: false,
        width: window.innerWidth,
        height: window.innerHeight
    });

    //
    $(document).keypress(function(event) {
        WebUI.handleKeyPress(event);
    });
    $(document).mousedown(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseDown(p);
    });
    $(document).mouseup(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseUp(p);
    });
    $(document).mousemove(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseMove(p);
    });

    //
    WebUI.initWidgets();
    WebUI.initVisualItems();
    WebUI.layoutWhenResourceReady();
}

WebUI.initWidgets = function() {
    
    WebUI.title = new WebUI.Text("Introduction to HCI");
    WebUI.text_id = new WebUI.Text("ID");
    WebUI.text_pwd = new WebUI.Text("Password");
    WebUI.text_blah = new WebUI.Text("I want to get A+!");
    
    WebUI.btn_ok = new WebUI.PushButton("OK", {width:100, height:50});
    WebUI.btn_cancel = new WebUI.PushButton("Cancel", {width:100, height:50});
    
    WebUI.img_html = new WebUI.Image("resources/HTML5.png", {width: 100, height: 80});
    WebUI.img_css = new WebUI.Image("resources/CSS3.png", {width: 100, height: 80});
    WebUI.img_js = new WebUI.Image("resources/JS.png", {width: 100, height: 80});
    
    WebUI.edit_id = new WebUI.TextField("", {width:200, height:50});
    WebUI.edit_pwd = new WebUI.TextField("", {width:200, height:50});
    
    WebUI.switch = new WebUI.Switch('false', {width:100, height:50});
}

WebUI.initVisualItems = function() {
    WebUI.widgets.forEach(widget => {
        widget.initVisualItems();
    });
}

WebUI.layoutWhenResourceReady = function() {
    let is_resource_loaded = true;
    for (let i in WebUI.widgets) {
        let widget = WebUI.widgets[i];
        if (!widget.is_resource_ready) {
            is_resource_loaded = false;
            break;
        }
    }

    if (!is_resource_loaded) {
        setTimeout(arguments.callee, 50);
    }
    else {
        WebUI.widgets.forEach(widget => {
            widget.visual_items.forEach(item => {
                WebUI.canvas.add(item);
            });
        });
    
        WebUI.layoutWidgets();

        WebUI.canvas.requestRenderAll();
    }
}

WebUI.layoutWidgets = function() {
    WebUI.title.moveTo({left: 100, top: 10});
    WebUI.text_id.moveTo({left: 50, top: 160});
    WebUI.text_pwd.moveTo({left: 50, top: 220});
    WebUI.text_blah.moveTo({left: 50, top: 300});
    
    WebUI.btn_ok.moveTo({left: 50, top: 350});
    WebUI.btn_cancel.moveTo({left: 160, top: 350});
    
    WebUI.img_html.moveTo({left: 50, top: 50});
    WebUI.img_css.moveTo({left: 160, top: 50});
    WebUI.img_js.moveTo({left: 270, top: 50});
    
    WebUI.edit_id.moveTo({left: 150, top: 140});
    WebUI.edit_pwd.moveTo({left: 150, top: 200});
    
    WebUI.switch.moveTo({left: 250, top: 280});
    
}

WebUI.handleKeyPress = function(event) {
    let is_handled = false;

    if (WebUI.focused_widget) {
        is_handled = WebUI.focused_widget.handleKeyPress(event);
    }

    if (is_handled) {
        WebUI.canvas.requestRenderAll();
    }
}

WebUI.handleMouseDown = function(window_p) {
    let is_handled = false;
    
    if(WebUI.isInCanvas(window_p)){
        let canvas_p = WebUI.transformToCanvasCoords(window_p);
        
        WebUI.is_mouse_dragging = true;
        WebUI.mouse_drag_start = canvas_p;
        WebUI.mouse_drag_prev = canvas_p;
        
        let widget = WebUI.findWidgetOn(canvas_p);
        if(widget) {
            WebUI.focused_widget = widget;
            
            if(widget.is_draggable){
                WebUI.dragged_widget = widget;
            }
            else {
                WebUI.dragged_widget = null;
            }
            is_handled = widget.handleMouseDown(canvas_p);
        }
        else {
            WebUI.focused_widget = null;
            WebUI.dragged_widget = null;
        }
    }
    else {
        WebUI.is_mouse_dragging = false;
        WebUI.mouse_drag_start = {x:0, y:0};
        WebUI.mouse_drag_prev = {x:0, y:0};
        
        WebUI.focused_widget = null;
        WebUI.dragged_widget = null;
    }
    if (is_handled){
        WebUI.canvas.requestRenderAll();
    }
}

WebUI.handleMouseMove = function(window_p) {
    let is_handled = false;
    let canvas_p = WebUI.transformToCanvasCoords(window_p);
    
    let widget = WebUI.findWidgetOn(canvas_p);
    if(widget != WebUI.hovered_widget){
        if(WebUI.hovered_widget != null){
            is_handled = is_handled ||
                WebUI.hovered_widget.handleMouseExit(canvas_p);
        }
        if(widget != null){
            is_handled = is_handled ||
                widget.handleMouseEnter(canvas_p);
        }
        WebUI.hovered_widget = widget;
    }
    else {
        if(widget){
            is_handled = widget.handleMouseMove(canvas_p);
        }
    }
    if (WebUI.is_mouse_dragging){
        if(WebUI.dragged_widget != null) {
            let tx = canvas_p.x - WebUI.mouse_drag_prev.x;
            let ty = canvas_p.y - WebUI.mouse_drag_prev.y;
            WebUI.dragged_widget.translate({x: tx, y: ty});
            
            is_handled = true;
        }
        WebUI.mouse_drag_prev = canvas_p;
    }
    if (is_handled){
        WebUI.canvas.requestRenderAll();
    }
}

WebUI.handleMouseUp = function(window_p) {
    let is_handled = false;
    let canvas_p = WebUI.transformToCanvasCoords(window_p);
    
    let widget = WebUI.findWidgetOn(canvas_p);
    if (widget) {
        is_handled = widget.handleMouseUp(canvas_p);
    }
    
    if(WebUI.is_mouse_dragging){
        WebUI.is_mouse_dragging = false;
        WebUI.mouse_drag_start = {x:0, y:0};
        WebUI.mouse_drag_prev = {x:0, y:0};
        
        WebUI.dragged_widget = null;
        
        is_handled = true;
    }
    
    if(is_handled) {
        WebUI.canvas.requestRenderAll();
    }
        
}


WebUI.transformToCanvasCoords = function(window_p) {
    let rect = WebUI.canvas.getElement().getBoundingClientRect();
    let canvas_p = {
        x : window_p.x - rect.left,
        y : window_p.y - rect.top
    };
    return canvas_p;
}

WebUI.isInCanvas = function(window_p) {
    let rect = WebUI.canvas.getElement().getBoundingClientRect();
    if (window_p.x >= rect.left && 
        window_p.x < rect.left + rect.width &&
        window_p.y >= rect.top && 
        window_p.y < rect.top + rect.height) {
        return true;
    }
    else {
        return false;
    }
}

WebUI.findWidgetOn = function(canvas_p) {
    let x = canvas_p.x;
    let y = canvas_p.y;
    
    for(let i=0; i < this.widgets.length; i++){
        let widget = this.widgets[i];
        
        if(x >= widget.position.left &&
           x <= widget.position.left + widget.size.width &&
           y >= widget.position.top &&
           y <= widget.position.top + widget.size.height) {
            return widget;
        }
    }
    return null;
}

//
WebUI.Widget = function() {
    this.type = WebUI.WidgetTypes.UNDEFINED;
    
    this.parent = null;
    this.children = [];
    
    this.position = {left: 0, top: 0};
    this.size = {width: 0, height: 0};
    
    this.is_draggable = false;
    this.is_movable = true;
    
    this.visual_items = [];
    this.is_resource_ready = false;
    
    WebUI.widgets.push(this);
}

WebUI.Widget.prototype.initVisualItems = function() {
}

WebUI.Widget.prototype.moveTo = function(p) {
    if(!this.is_movable)
    {
        return;
    }

    let tx = p.left - this.position.left;
    let ty = p.top - this.position.top;

    this.translate({x: tx, y: ty});
}

WebUI.Widget.prototype.translate = function(v) {
    if(!this.is_movable) return;
    
    this.position.left += v.x;
    this.position.top += v.y;
    this.visual_items.forEach(item => {
        item.left += v.x;
        item.top += v.y;
    });
    this.children.forEach(child_widget => {
        child_widget.translate(v);
    });
}

WebUI.Widget.prototype.destroy = function() {
    if (this == WebUI.focused_widget) WebUI.focused_widget = null;
    if (this == WebUI.dragged_widget) WebUI.dragged_widget = null;
    if (this == WebUI.hovered_widget) WebUI.hovered_widget = null;

    this.visual_items.forEach(item => {
        WebUI.canvas.remove(item);
    });
    this.visual_items = [];
    
    let index = WebUI.widgets.indexOf(this);
    if(index > -1)
    {
        WebUI.widgets.splice(index, 1);
    }

    this.children.forEach(child_widget => {
        child_widget.destroy();
    });
    this.children = [];
}
WebUI.Widget.prototype.initVisualItems = function() {}
WebUI.Widget.prototype.handleKeyPress = function(event) {
    return false;
}

WebUI.Widget.prototype.handleMouseDown = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseMove = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseUp = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseEnter = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseExit = function(canvas_p) {
    return false;
}

//
WebUI.Text = function(label) {
    WebUI.Widget.call(this);
    
    this.type = WebUI.WidgetTypes.TEXT;
    this.label = label;
    
    this.font_family = 'System';
    this.font_size = 20;
    this.font_weight = 'bold';
    this.text_align = 'left';
    this.text_color = 'black';
}

WebUI.Text.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Text.prototype.constructor = WebUI.Text;
WebUI.Text.prototype.initVisualItems = function() {
    let text = new fabric.Text(this.label, {
        left:       this.position.left,
        top:        this.position.top,
        selectable: false,
        fontFamily: this.font_family,
        fontSize:   this.font_size,
        fontWeight: this.font_weight,
        textAlign:  this.text_align,
        stroke:     this.text_color,
        fill:       this.text_color
    });
    
    let bound = text.getBoundingRect();
    this.position.left = bound.left;
    this.position.top = bound.top;
    this.size.width = bound.width;
    this.size.height = bound.height;
    
    this.visual_items.push(text);
    this.is_resource_ready = true;
}
//
WebUI.Image = function(path, desired_size) {
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.IMAGE;
    this.path = path;
    this.desired_size = desired_size;
}

WebUI.Image.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Image.prototype.constructor = WebUI.Image;

WebUI.Image.prototype.initVisualItems = function() {
    let widget = this;
    
    fabric.Image.fromURL(this.path, function(img) {
        if(widget.desired_size != undefined) {
            img.scaleToWidth(widget.desired_size.width);
            img.scaleToHeight(widget.desired_size.height);
            widget.size = widget.desired_size;
        }
        else {
            widget.size = { width: img.width, height: img.height };
        }
        img.set({left: widget.position.left,
                 top: widget.position.top,
                 selectable: false});
        
        widget.visual_items.push(img);
        widget.is_resource_ready = true;
    });
}

//
WebUI.TextField = function(label, desired_size) {
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.TEXT_FIELD;
    this.label = label;
    this.desired_size = desired_size;
    this.margin = 10;

    this.stroke_color = 'black';
    this.fill_color = 'white';
    this.stroke_width = 5;    

    this.font_family = 'System';
    this.font_size = 20;
    this.font_weight = 'normal';
    this.text_align = 'left';
    this.text_color = 'black';
}

WebUI.TextField.prototype = Object.create(WebUI.Widget.prototype);
WebUI.TextField.prototype.constructor = WebUI.TextField;

WebUI.TextField.prototype.initVisualItems = function() {
    let boundary = new fabric.Rect({
        left:        this.position.left,
        top:         this.position.top,
        width:       this.desired_size.width,
        height:      this.desired_size.height,
        fill:        this.fill_color,
        stroke:      this.stroke_color,
        strokeWidth: this.stroke_width,
        selectable: false
    });
    
    let textbox = new fabric.Textbox(this.label, {
        left:       this.position.left + this.margin,                
        fontFamily: this.font_family,
        fontSize:   this.font_size,
        fontWeight: this.font_weight,
        textAlign:  this.text_align,
        stroke:     this.text_color,
        fill:       this.text_color,
        selectable: false
    });
    
    let bound = textbox.getBoundingRect();
    textbox.top = this.position.top + (this.desired_size.height - bound.height)/2;
    
    this.size = this.desired_size;
    
    this.visual_items.push(boundary);
    this.visual_items.push(textbox);
    
    this.is_resource_ready = true;
}

WebUI.TextField.prototype.handleMouseDown = function(canvas_p) {
    let textbox = this.visual_items[1];        
    textbox.enterEditing();

    return true;
}

WebUI.TextField.prototype.handleKeyPress = function(event) {
    let boundary = this.visual_items[0];
    let textbox = this.visual_items[1];        

    let new_label = textbox.text;
    let old_label = this.label;
    this.label = new_label;

    if (event.keyCode == 13) {
        let text_enter_removed = new_label.replace(/(\r\n|\n|\r)/gm, "");
        textbox.text = text_enter_removed;
        this.label = text_enter_removed;
        
        if (textbox.hiddenTextarea != null) {
            textbox.hiddenTextarea.value = text_enter_removed;
        }

        textbox.exitEditing();

        return true;    
    }

    if (old_label != new_label && old_label.length < new_label.length) {
        let canvas = document.getElementById("c");
        let context = canvas.getContext("2d");
        context.font = this.font_size.toString() + "px " + this.font_family;

        let boundary_right = boundary.left + boundary.width - this.margin;
        let text_bound = textbox.getBoundingRect();
        let text_width = context.measureText(new_label).width;
        let text_right = text_bound.left + text_width;

        if (boundary_right < text_right) {
            textbox.text = old_label;
            this.label = old_label;
            
            if (textbox.hiddenTextarea != null) {
                textbox.hiddenTextarea.value = old_label;
            }

            return true;
        }
    }
    
    return false;
}

//
WebUI.PushButton = function(label, desired_size) {
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.PUSH_BUTTON;
    this.label = label;       
    this.desired_size = desired_size;
    this.is_pushed = false;

    this.stroke_color = 'black';
    this.fill_color = 'white';

    this.font_family = 'System';
    this.font_size = 20;
    this.font_weight = 'bold';
    this.text_align = 'center';
    this.text_color = 'black';
}

WebUI.PushButton.prototype = Object.create(WebUI.Widget.prototype);
WebUI.PushButton.prototype.constructor = WebUI.PushButton;

WebUI.PushButton.prototype.initVisualItems = function() {
    let background = new fabric.Rect({
        left: this.position.left,
        top: this.position.top,
        width: this.desired_size.width,
        height: this.desired_size.height,
        fill: this.fill_color,
        stroke: this.stroke_color,
        strokeWidth: 1,
        selectable: false
    });

    let text = new fabric.Text(this.label, {
        left: this.position.left,
        top: this.position.top,
        selectable: false,
        fontFamily: this.font_family,
        fontSize:   this.font_size,
        fontWeight: this.font_weight,
        textAlign:  this.text_align,
        stroke:     this.text_color,
        fill:       this.text_color,
    });

    let bound = text.getBoundingRect();
    text.left = this.position.left + this.desired_size.width/2 - bound.width/2;
    text.top = this.position.top + this.desired_size.height/2 - bound.height/2;

    this.size = this.desired_size;

    //
    this.visual_items.push(background);
    this.visual_items.push(text);
    this.is_resource_ready = true;
}

WebUI.PushButton.prototype.handleMouseDown = function() {
    if (!this.is_pushed){
        this.translate({x:0, y:5});
        this.is_pushed = true;
        
        if (this.onPushed != undefined) {
            this.onPushed.call(this);
        }
        return true;
    }    
    else {
        return false;
    }
}

WebUI.PushButton.prototype.handleMouseUp = function() {
    if (this.is_pushed) {
        this.translate({x:0, y:-5});
        this.is_pushed = false;
        
        return true;
    }
    else {
        return false;
    }
}

WebUI.PushButton.prototype.handleMouseEnter = function() {
    this.visual_items[0].set('strokeWidth', 3);
    return true;
}

WebUI.PushButton.prototype.handleMouseExit = function() {
    this.visual_items[0].set('strokeWidth', 1);
    
    if (this.is_pushed) {
        this.translate({x:0, y:-5});
        this.is_pushed = false;
    }
    return true;
}


//
WebUI.Switch = function(is_on, desired_size) {
    WebUI.Widget.call(this);
    
    this.type = WebUI.WidgetTypes.SWITCH;    
    this.desired_size = desired_size;
    this.is_on = is_on;
}

WebUI.Switch.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Switch.prototype.constructor = WebUI.Switch;

WebUI.Switch.prototype.initVisualItems = function() {
   let area = new fabric.Rect({
        left: this.position.left,
        top: this.position.top,
        width: this.desired_size.width,
        height: this.desired_size.height,
        fill: 'rgb(142,142,147)',
        selectable: false,
        rx: this.desired_size.height/2,
        ry: this.desired_size.height/2
        });    
   
    let circle = new fabric.Circle({
        left: this.position.left,
        top: this.position.top + this.desired_size.height*0.05,
        radius: this.desired_size.height*0.45,
        stroke: 'rgb(142,142,147)',
        fill: 'white',
        selectable: false        
    });
    
    this.size = this.desired_size;
    
    this.visual_items.push(area);    
    this.visual_items.push(circle);
    this.is_resource_ready = true;
} 

WebUI.Switch.prototype.handleMouseDown = function() {
    let canvas = WebUI.canvas;
    if (!this.is_on){
        this.visual_items[0].set('fill', 'rgb(48,209,88)');
        this.visual_items[1].set('stroke', 'rgb(48,209,88)');
        this.visual_items[1].animate('left', this.position.left+this.desired_size.width*0.5, {
            onChange: canvas.renderAll.bind(canvas),
            duration: 100,
            easing: fabric.util.ease.easeInSine
        });
        this.is_on = true;  
    
    }
    else {
        this.visual_items[0].set('fill', 'rgb(142,142,147)');
        this.visual_items[1].set('stroke', 'rgb(142,142,147)');
        this.visual_items[1].animate('left', this.position.left, {
            onChange: canvas.renderAll.bind(canvas),
            duration: 100,
            easing: fabric.util.ease.easeInSine
        });
        this.is_on = false;                  
    }
    return true;
}


//
$(document).ready(function() {    
    WebUI.initialize();
});
