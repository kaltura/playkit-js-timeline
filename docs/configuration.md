## Configuration

#### Configuration Structure

The configuration uses the following structure:
****
```js
{
  adBreakCuePoint?: CuePointOptionsObject  
}
```

##

> ### adBreakCuePoint
>
> ##### Type: [`CuePointOptionsObject`](./types.md#cuepointoptionsobject)
>
> ##### Default: `null` - No cue points displayed for the ad breaks.
>
> ##### Description: Options for the ad breaks cue points.  
> 
> ##### Examples:
>
> Show The default cue point for the ad breaks:  
> ```js
> {
>   adBreakCuePoint: {}
> }
> ```
> Show a custom cue point for the ad breaks:  
> ```js
> {
>   adBreakCuePoint: {
>     marker: {
>       width: 10,
>       color: 'rgb(255, 0, 0)' 
>     }   
>   }
> }
> ```
