[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'   # any error stops the script instead of carrying on

#Asks windows what current song is and print as Json
#RUNS with Powershell NOT Pwsh



#part 1 - await helper
#so windows media API answers everything with a callback, a WinRT "async" operation (JS promise equivalent)
#powershell doesnt have await so we convert it to a normal .NET task and wait forit to complete

Add-Type -AssemblyName System.Runtime.WindowsRuntime #load library containing the extension method to convert WinRT async to .NET task
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { #search for the RIGHT generic AsTask method (for async)
    $_.Name -eq 'AsTask' -and 
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
 })[0]
 
 function await($WinRtTask, $ResultType) { #using function to await a WinRT async operation and return the result
     $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
     $netTask  = $asTask.Invoke($null, @($WinRtTask))
     $netTask.Wait(-1) | Out-Null # -1 = infinite timeout, Out-Null to suppress output
    $netTask.Result
}


#PART 2 - ask whats playing 
#so load windows media types so powershell knows ab it

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]) #ask for media manager - second bracket tells what to expect back (the type of the result)
$session = $manager.GetCurrentSession() #get the current playing app

if ($null -eq $session) {
    '{ "playing": false }'
    exit
} #if nothing, print a safe false and STOP

$props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]) #ask for song info



#part 3 - now convert to json for electron to read 
$timeline = $session.GetTimelineProperties() #call timeline once to store data and we use it multiple times without calling again
[PSCustomObject]@{ #builds an object
    playing = $true
    title = $props.Title
    artist = $props.Artist
    album = $props.AlbumTitle
    app = $session.SourceAppUserModelId
    position = $timeline.Position.TotalMilliseconds
    duration = $timeline.EndTime.Subtract($timeline.StartTime).TotalMilliseconds  #ending timestamp minus starting timestamp = duration
    updated  = $timeline.LastUpdatedTime.ToString('o')
    status = $session.GetPlaybackInfo().PlaybackStatus.ToString()
    
} | ConvertTo-Json