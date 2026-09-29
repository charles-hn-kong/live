import type { LiveSourceType } from '../../types/liveRoom'
import HlsPlayer from './HlsPlayer';

type IProps = {
    type: LiveSourceType;
    url: string;
}

const LivePlayer = (props: IProps) => {
    const {type, url} = props;
    if (type === 'hls') {
        return <HlsPlayer url={url} />
    }
    
    return (
        <video 
            src={url}
            controls
            autoPlay
            muted
            playsInline
            style={{
                width: '100%',
                background: '#000000'
            }}
        />
    )
}

export default LivePlayer;