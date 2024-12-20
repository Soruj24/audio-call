import Link from "next/link"


const Navbar = () => {
    return (
        <div className="flex justify-center space-x-4 p-4">
            <Link href="/"> Home </Link>
            <Link href="/audio-call"> Audio Call </Link>

        </div>
    )
}

export default Navbar