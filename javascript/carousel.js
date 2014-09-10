
function Carousel(element_str, container_str, panes_str){
    var self = this;   
    var element = $(element_str);   
    var container = element.find(container_str);
    this.panes = container.find(panes_str);
    var new_pane = true;
                        
    var pane_count = self.panes.length;          
    this.current_pane = 0;
    
    var on_set_pane = null;
                                                                                    
    this.init = function() {  
        var new_container_width = 0;
        self.panes.each(function(index){
            new_container_width += $(this).outerWidth(true);
            $(this).off('resize');
            $(this).on('resize', self.resize_panes);
        });                                                  
        container.css('width', new_container_width);  
        element.hammer({ dragLockToAxis: true });                                                         
        $(document).on('release dragleft dragright swipeleft swiperight', element_str, drag_carousel);                                                 
    };
                                        
    
    this.resize_panes = function(){    
        var new_container_width = 0;
        self.panes.each(function(index){
            new_container_width += $(this).outerWidth(true);
            $(this).off('resize');
            $(this).on('resize', self.resize_panes);
        });                                                  
        container.css('width', new_container_width);  
    }
    
    this.refresh = function(){                                                                                                        
        container.css('left', self.get_current_left_offset() + 'px'); 
    }
    
    this.set_pane = function(index, allow_callback){  
        index = Math.max(0, Math.min(index, pane_count - 1));  
        self.current_pane = index;                                                                                                                                        
        container.css('left', self.get_current_left_offset() + 'px');    
        
        if ((on_set_pane != null) && (allow_callback !== false)){
            on_set_pane(self.current_pane);
        }           
        
        new_pane = true;                                                                            
    };  
        
    this.set_on_set_pane = function(callback){
        on_set_pane = callback;                        
    }     
              
    this.next = function() { 
        return this.set_pane(self.current_pane + 1); 
    };
    this.prev = function() { 
        return this.set_pane(self.current_pane - 1); 
    };          

    this.get_current_left_offset = function(){  
        return this.get_index_left_offset(self.current_pane);
    }
    
    this.get_index_left_offset = function(index){   
        index = Math.max(0, Math.min(index, pane_count - 1));                                                                              
        var index_left = self.panes.eq(index).position().left;
        var index_width = self.panes.eq(index).outerWidth(true); 
        var element_left = element.position().left;
        var element_width = element.outerWidth(true); 
                           
        var element_center = element_left + (element_width / 2);
        var index_center = index_left + (index_width / 2);
        
        return element_center - index_center;
    }
    
    this.set_pane_by_scroll = function(){  
        if (pane_count > 1){     
            this.set_pane(this.get_pane_by_scroll());
        }        
    }
    this.get_pane_by_scroll = function(){  
        var new_pane = -1;
        var scroll_left = container.position().left;
        var this_offset;
        var last_offset = this.get_index_left_offset(0);    
        for(var i = 1; i <= pane_count; i++){
            this_offset = this.get_index_left_offset(i);
            if (scroll_left > last_offset - ((last_offset - this_offset) / 2)){
                new_pane = i - 1;  
                break;
            }   
            last_offset = this_offset;                    
        }
        if(new_pane == -1){
            new_pane = pane_count - 1;
        }
        return new_pane;
    }
                  
    function drag_carousel(ev) {
        // disable browser scrolling                           
        ev.gesture.preventDefault(); 
                                                                  
        switch(ev.type) {   
            case 'dragright':
            case 'dragleft':
                new_pane = false; 
                $(self.panes).off('click.stop_prop'); 
                if(Math.abs(ev.gesture.deltaX) > 10){
                    $(self.panes).on('click.stop_prop', function(e){
                        e.preventDefault();
                    });                                   
                }                                                                                                                                                                                 
                container.css('left', self.get_current_left_offset() + ev.gesture.deltaX + 'px');  
                $(self.panes).removeClass('next_selected');
                self.panes.eq(self.get_pane_by_scroll()).addClass('next_selected');
                $(self.panes).filter('a.selected').removeClass('next_selected');
                             
            break; 
            case 'swipeleft':
                self.next();
                ev.gesture.stopDetect();
            break;  
            case 'swiperight':
                self.prev();
                ev.gesture.stopDetect();
            break;  
            case 'release':       
                if(new_pane){  
                    $(self.panes).off('click.stop_prop'); 
                }   
                          
                if((ev.gesture.deltaTime < 250) && (ev.gesture.distance < 3)){
                    /* tap */ 
                    //console.log(ev);  
                    
                    self.set_pane($(ev.gesture.target).parent().parent().attr('index'));
                }
                else{
                    /* release */ 
                    self.set_pane_by_scroll();     
                } 
                ev.gesture.stopDetect();  
            break;
        }                                                                                                      
    }                                                                                                                                                      
}
                   