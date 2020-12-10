## `TimedCuePointOptionsObject`
>
> ```js
> {
>   time: number,
>   presets?: Array<string>,
>   marker?: MarkerOptionsObject,
>   preview?: PreviewOptionsObject
> } 
> ```
>
> ##
>
> ### `time`
> 
> ##### Type: `number`
>
> ##### Description: The cue point time  
>
> ##
>
> ### `presets`
> 
> ##### Type: `Array<string>`
>
> ##### Description: The presets the cue point should be displayed
>  
> ##
>
> ### `marker`
> 
> ##### Type: [`MarkerOptionsObject`](#markeroptionsobject)
>
> ##### Description: The marker options  
>
> ##
>
> ### `preview`
> 
> ##### Type: [`PreviewOptionsObject`](#previewoptionsobject)
>
> ##### Description: The preview options
>  
## `CuePointOptionsObject`
>
> ```js
> {
>   marker?: MarkerOptionsObject,
>   preview?: PreviewOptionsObject
> } 
> ```
>
> ##
>
> ### `marker`
> 
> ##### Type: [`MarkerOptionsObject`](#markeroptionsobject)
>
> ##### Description: The marker options  
>
> ##
>
> ### `preview`
> 
> ##### Type: [`PreviewOptionsObject`](#previewoptionsobject)
>
> ##### Description: The preview options  
>
## `MarkerOptionsObject`
>
> ```js
> {
>   get?: Function | string,
>   props?: Object,
>   color?: string,
>   width?: number,
>   className?: string
> } 
> ```
>
> ##
>
> ### `get`
> 
> ##### Type: `Function | string`
>
> ##### Description: The marker component  
>
> ##
>
> ### `props`
> 
> ##### Type: `Object`
>
> ##### Description: The marker component props  
>
> ##
>
> ### `color`
> 
> ##### Type: `string`
>
> ##### Description: The marker color  
>
> ##
>
> ### `width`
> 
> ##### Type: number
>
> ##### Description: The marker width  
>
> ##
>
> ### `className`
> 
> ##### Type: string
>
> ##### Description: The marker class name 
>
## `PreviewOptionsObject`
>
> ```js
> { 
>   get?: Function | string,
>   props?: Object,
>   width?: number,
>   height?: number,
>   className?: string,
>   hideTime?: boolean,
>   sticky?: boolean
> } 
> ```
>
> ##
>
> ### `get`
> 
> ##### Type: `Function | string`
>
> ##### Description: The preview component  
>
> ##
>
> ### `props`
> 
> ##### Type: `Object`
>
> ##### Description: The preview component props  
>
> ##
>
> ### `width`
> 
> ##### Type: number
>
> ##### Description: The preview width  
>
> ##
>
> ### `height`
> 
> ##### Type: number
>
> ##### Description: The preview height  
>
> ##
>
> ### `className`
> 
> ##### Type: string
>
> ##### Description: The preview class name  
>
> ##
>
> ### `hideTime`
> 
> ##### Type: boolean
>
> ##### Description: Whether to hide the time bubble, `false` by default.   
>
> ##
>
> ### `sticky`
> 
> ##### Type: boolean
>
> ##### Description: Whether the preview is accessible on hovering, `true` by default.   
>
## `SeekbarPreviewOptionsObject`
>
> ```js
> { 
>   get?: Function | string,
>   props?: Object,
>   presets?: Array<string>,
>   width?: number,
>   height?: number,
>   className?: string,
>   hideTime?: boolean,
>   sticky?: boolean
> } 
> ```
>
> ##
>
> ### `get`
> 
> ##### Type: `Function | string`
>
> ##### Description: The seekbar preview component  
>
> ##
>
> ### `props`
> 
> ##### Type: `Object`
>
> ##### Description: The seekbar preview component props  
>
> ##
>
> ### `presets`
> 
> ##### Type: `Array<string>`
>
> ##### Description: The presets the seekbar preview should be displayed  
>
> ##
>
> ### `width`
> 
> ##### Type: number
>
> ##### Description: The seekbar preview width  
>
> ##
>
> ### `height`
> 
> ##### Type: number
>
> ##### Description: The seekbar preview height  
>
> ##
>
> ### `className`
> 
> ##### Type: string
>
> ##### Description: The seekbar preview class name  
>
> ##
>
> ### `hideTime`
> 
> ##### Type: boolean
>
> ##### Description: Whether to hide the time bubble, `false` by default.   
>
> ##
>
> ### `sticky`
> 
> ##### Type: boolean
>
> ##### Description: Whether the seekbar preview is accessible on hovering, `true` by default.   
