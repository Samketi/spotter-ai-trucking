import TripForm from "../components/TripForm";
export default function Home() {

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Trucking Trip Planner
      </h1>
      <TripForm />
    </div>
  );
}
