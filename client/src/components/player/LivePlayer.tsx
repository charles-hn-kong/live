import type { LiveSourceType, LiveMode } from '../../types/liveRoom'
import HlsPlayer from './HlsPlayer';
import Mp4Player from './Mp4Player';
import './LivePlayer.css';

type IProps = {
    type: LiveSourceType;
    url: string;
    mode: LiveMode;
    startedAt?: string;
}

const LivePlayer = (props: IProps) => {
    const {type, url, mode, startedAt} = props;
    if (type === 'hls') {
        return <HlsPlayer url={url} />
    }
    
    return (
        <Mp4Player
            url={url}
            mode={mode}
            startedAt={startedAt}
        />
    )
}

export default LivePlayer;
