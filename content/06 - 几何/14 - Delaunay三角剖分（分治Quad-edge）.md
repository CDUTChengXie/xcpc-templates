# Delaunay三角剖分（分治Quad-edge）

整数 |x|,|y|<=1e6，越界抛 invalid_argument；使用 __int128 判方向与空圆，非浮点/eps 版本。 精确去重；Result.points 为排序去重点，triangles/edges 下标对应它，范围 [0,points.size())。

triangles 均 CCW；共圆任选对角线；全共线无三角形 edges 为邻点链，0/1 点无边；不保证原编号，不做约束 Delaunay。

排序及分治 O(n log n)，工作空间 O(n)，递归深度 O(log n)。

```cpp
namespace Delaunay {
    struct Point {
        long long x, y;
    };
    struct Result {
        std::vector<Point> points; // 排序去重后的点，下面两个数组的编号都指向 points
        std::vector<std::array<int, 3>> triangles; // 每项为一个三角形的三个顶点，逆时针排列
        std::vector<std::array<int, 2>> edges; // 每项为一条无向边的两个端点；全共线时连接相邻点
    };
    namespace detail {
        using Int = __int128;
        Int orient(Point a, Point b, Point c) {
            return Int(b.x - a.x) * (c.y - a.y) - Int(b.y - a.y) * (c.x - a.x);
        }
        Int incircle(Point p, Point a, Point b, Point c) {
            Int ax = a.x - p.x, ay = a.y - p.y, bx = b.x - p.x, by = b.y - p.y, cx = c.x - p.x,
                cy = c.y - p.y;
            return (ax * by - ay * bx) * (cx * cx + cy * cy) +
                   (bx * cy - by * cx) * (ax * ax + ay * ay) +
                   (cx * ay - cy * ax) * (bx * bx + by * by);
        }
        class Builder {
            struct Quad {
                Quad *rot = nullptr, *o = nullptr;
                int p = -1;
                bool active = false, mark = false;
                Quad *sym() {
                    return rot->rot;
                }
                int dest() {
                    return sym()->p;
                }
                Quad *prev() {
                    return rot->o->rot;
                }
                Quad *next() {
                    return sym()->prev();
                }
            };
            using Q = Quad *;
            std::vector<Point> pts;
            std::vector<std::unique_ptr<Quad[]>> pool;
            std::vector<Q> free;
            Int turn(int a, int b, int c) {
                return orient(pts[a], pts[b], pts[c]);
            }
            bool circ(int p, int a, int b, int c) {
                return incircle(pts[p], pts[a], pts[b], pts[c]) > 0;
            }
            Q link(int a, int b) {
                Q q;
                if (free.empty()) {
                    auto block = std::make_unique<Quad[]>(4);
                    q = block.get();
                    for (int i = 0; i < 4; ++i)
                        q[i].rot = &q[(i + 1) % 4];
                    pool.push_back(std::move(block));
                } else {
                    q = free.back();
                    free.pop_back();
                }
                Q r = q;
                for (int i = 0; i < 4; ++i, r = r->rot) {
                    r->p = -1;
                    r->active = false;
                    r->mark = false;
                }
                q->o = q;
                q->rot->o = q->rot->sym();
                q->sym()->o = q->sym();
                q->rot->sym()->o = q->rot;
                q->p = a;
                q->sym()->p = b;
                q->active = q->sym()->active = true;
                return q;
            }
            void splice(Q a, Q b) {
                std::swap(a->o->rot->o, b->o->rot->o);
                std::swap(a->o, b->o);
            }
            Q connect(Q a, Q b) {
                Q q = link(a->dest(), b->p);
                splice(q, a->next());
                splice(q->sym(), b);
                return q;
            }
            void erase(Q e) {
                splice(e, e->prev());
                splice(e->sym(), e->sym()->prev());
                e->active = e->sym()->active = false;
                free.push_back(e);
            }
            std::pair<Q, Q> rec(int l, int r) {
                int n = r - l;
                if (n <= 3) {
                    Q a = link(l, l + 1);
                    if (n == 2)
                        return {a, a->sym()};
                    Q b = link(l + 1, l + 2);
                    splice(a->sym(), b);
                    Int side = turn(l, l + 1, l + 2);
                    Q c = side ? connect(b, a) : nullptr;
                    return {side < 0 ? c->sym() : a, side < 0 ? c : b->sym()};
                }
                int mid = l + (n + 1) / 2;
                auto [ra, A] = rec(l, mid);
                auto [B, rb] = rec(mid, r);
                while (true) {
                    if (turn(B->p, A->dest(), A->p) < 0)
                        A = A->next();
                    else if (turn(A->p, B->dest(), B->p) > 0)
                        B = B->sym()->o;
                    else
                        break;
                }
                Q base = connect(B->sym(), A);
                if (A->p == ra->p)
                    ra = base->sym();
                if (B->p == rb->p)
                    rb = base;
                auto valid = [&](Q e) { return turn(e->dest(), base->dest(), base->p) > 0; };
                while (true) {
                    Q LC = base->sym()->o;
                    if (valid(LC))
                        while (circ(LC->o->dest(), base->dest(), base->p, LC->dest())) {
                            Q next = LC->o;
                            erase(LC);
                            LC = next;
                        }
                    Q RC = base->prev();
                    if (valid(RC))
                        while (circ(RC->prev()->dest(), base->dest(), base->p, RC->dest())) {
                            Q next = RC->prev();
                            erase(RC);
                            RC = next;
                        }
                    if (!valid(LC) && !valid(RC))
                        break;
                    if (!valid(LC) || (valid(RC) && circ(RC->dest(), RC->p, LC->dest(), LC->p)))
                        base = connect(RC, base->sym());
                    else
                        base = connect(base->sym(), LC->sym());
                }
                return {ra, rb};
            }

          public:
            // 内部工作对象接收已排序去重的点，池生命周期随对象自动释放。
            explicit Builder(std::vector<Point> p) : pts(std::move(p)) {}
            // 执行分治并遍历有向面；返回去重点、CCW 三角形和全部无向边。
            Result run() {
                Result out;
                out.points = pts;
                if (pts.size() < 2)
                    return out;
                rec(0, int(pts.size()));
                for (auto &block : pool)
                    for (int i = 0; i < 4; ++i) {
                        Q e = &block[i];
                        if (!e->active)
                            continue;
                        if (e->p < e->dest())
                            out.edges.push_back({e->p, e->dest()});
                        if (e->mark)
                            continue;
                        std::vector<int> face;
                        Q cur = e;
                        do {
                            cur->mark = true;
                            face.push_back(cur->p);
                            cur = cur->next();
                        } while (cur != e);
                        if (face.size() == 3 && turn(face[0], face[1], face[2]) > 0)
                            out.triangles.push_back({face[0], face[1], face[2]});
                    }
                std::sort(out.edges.begin(), out.edges.end());
                return out;
            }
        };
    }
    // 无约束 Delaunay；精确去重并返回排序点的新编号，共线/共圆不做随机扰动。
    Result build(std::vector<Point> p) {
        for (Point a : p)
            if (a.x < -1000000 || a.x > 1000000 || a.y < -1000000 || a.y > 1000000)
                throw std::invalid_argument("Delaunay: coordinate exceeds 1e6");
        std::sort(p.begin(), p.end(),
                  [](Point a, Point b) { return std::tie(a.x, a.y) < std::tie(b.x, b.y); });
        p.erase(std::unique(p.begin(), p.end(),
                            [](Point a, Point b) { return a.x == b.x && a.y == b.y; }),
                p.end());
        return detail::Builder(std::move(p)).run();
    }
}
```
