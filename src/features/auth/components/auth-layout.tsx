import Image from "next/image";
import Link from "next/link";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-svh w-full bg-background text-foreground flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image src="/logo.svg" alt="FLowbit" width={30} height={30} />
          FLowbit
        </Link>
        {children}
      </div>
    </div>
  );
};
  
  export default Layout;