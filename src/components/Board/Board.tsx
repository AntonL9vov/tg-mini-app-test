import './Board.css'


const Board = () => {
    // Return view, these are regular three.js elements expressed in JSX
    return (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
            <planeGeometry args={[5, 5]}/>
            <meshStandardMaterial color="red"/>
        </mesh>
    )
}

export default Board;