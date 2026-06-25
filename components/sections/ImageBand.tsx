import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/*
  Full-width editorial "moment". Placeholder image is a Picsum seed; swap the
  src for the generated asset (prompt shipped alongside this build). The bottom
  scrim guarantees the overlaid line passes contrast over any photo.
*/
export function ImageBand({
  src,
  alt,
  line,
}: {
  src: string;
  alt: string;
  line: string;
}) {
  return (
    <section className="relative border-b border-line">
      <div className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover opacity-[0.8]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
        <div className="absolute inset-0 flex items-end pb-12">
          <Container>
            <Reveal>
              <p className="max-w-[26ch] text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[2rem]">
                {line}
              </p>
            </Reveal>
          </Container>
        </div>
      </div>
    </section>
  );
}
