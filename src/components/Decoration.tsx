import {Html} from '@react-three/drei';

function Decoration({position, children}) {
    return (
        <Html position={position}>
            <div style={{fontSize: '2rem'}}>{children}</div>
        </Html>);
}

export default Decoration;