import { render, screen, fireEvent } from "@testing-library/react";
import Cartellino from "./Cartellino";
import MenuAzioni from "./MenuAzioni";

test("cartellino mostra numero e targa", () => {
  const { container } = render(<Cartellino numero={4} targa="VF 16701"/>);
  expect(screen.getByText("KIT 4")).toBeInTheDocument();
  expect(screen.getByText("VF 16701")).toBeInTheDocument();
  expect(container.firstChild).not.toHaveClass("cart-off");
});

test("cartellino spento per MAGAZZINO e targa vuota", () => {
  const { container, rerender } = render(<Cartellino numero={12} targa="MAGAZZINO"/>);
  expect(container.firstChild).toHaveClass("cart-off");
  rerender(<Cartellino numero={12} targa=""/>);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("menu: apre, esegue la voce e si chiude", () => {
  const fn = jest.fn();
  render(<MenuAzioni etichetta="Esporta" voci={[{ label:"CSV", onClick: fn }]}/>);
  expect(screen.queryByText("CSV")).toBeNull();
  fireEvent.click(screen.getByText("Esporta"));
  fireEvent.click(screen.getByText("CSV"));
  expect(fn).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("CSV")).toBeNull();
});

test("menu vicino al bordo sinistro si apre verso destra", () => {
  // jsdom: il pulsante sta a left 0, cioè nella metà sinistra dello schermo
  render(<MenuAzioni etichetta="Esporta" voci={[{ label:"CSV", onClick: () => {} }]}/>);
  fireEvent.click(screen.getByText("Esporta"));
  expect(screen.getByRole("menu")).toHaveClass("dx");
});
